import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Info, Plus, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { recipesAPI, categoriesAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

const CreateRecipe = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    difficulty: "moyenne",
    category: "",
    tags: [] as string[],
    ingredients: [] as Ingredient[],
    instructions: [] as Instruction[],
    nutrition: {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
    },
  });

  const [tagInput, setTagInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: "",
    quantity: "",
    unit: "",
  });

  const steps = [
    "Informations générales",
    "Ingrédients",
    "Étapes de préparation",
    "Révision et publication",
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log("Loading categories...");
      const data = await categoriesAPI.getAll();
      console.log("Categories response:", data);
      
      if (data.success) {
        const categoriesList = data.data || data;
        console.log("Categories list:", categoriesList);
        
        if (Array.isArray(categoriesList) && categoriesList.length > 0) {
          setCategories(categoriesList);
          console.log("Categories set successfully:", categoriesList.length);
        } else {
          console.warn("No categories found or empty array");
          toast({
            title: "Avertissement",
            description: "Aucune catégorie disponible. Veuillez contacter l'administrateur.",
            variant: "destructive",
          });
        }
      } else {
        console.error("API returned success: false", data);
        toast({
          title: "Erreur",
          description: data.message || "Impossible de charger les catégories",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error loading categories:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les catégories",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image est trop grande (max 5MB)",
          variant: "destructive",
        });
        return;
      }

      // Vérifier le type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une image",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        handleInputChange("image", result); // Stocker en base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const handleAddIngredient = () => {
    if (newIngredient.name.trim()) {
      handleInputChange("ingredients", [...formData.ingredients, { ...newIngredient }]);
      setNewIngredient({ name: "", quantity: "", unit: "" });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    handleInputChange(
      "ingredients",
      formData.ingredients.filter((_, i) => i !== index)
    );
  };

  const handleAddInstruction = () => {
    const newStep = formData.instructions.length + 1;
    handleInputChange("instructions", [
      ...formData.instructions,
      { step: newStep, description: "" },
    ]);
  };

  const handleUpdateInstruction = (index: number, description: string) => {
    const updated = [...formData.instructions];
    updated[index].description = description;
    handleInputChange("instructions", updated);
  };

  const handleRemoveInstruction = (index: number) => {
    const updated = formData.instructions
      .filter((_, i) => i !== index)
      .map((inst, i) => ({ ...inst, step: i + 1 }));
    handleInputChange("instructions", updated);
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) {
          toast({
            title: "Erreur",
            description: "Le titre est requis",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.category) {
          toast({
            title: "Erreur",
            description: "La catégorie est requise",
            variant: "destructive",
          });
          return false;
        }
        if (formData.prepTime <= 0 || formData.cookTime <= 0) {
          toast({
            title: "Erreur",
            description: "Les temps de préparation et cuisson sont requis",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (formData.ingredients.length === 0) {
          toast({
            title: "Erreur",
            description: "Au moins un ingrédient est requis",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (formData.instructions.length === 0) {
          toast({
            title: "Erreur",
            description: "Au moins une étape est requise",
            variant: "destructive",
          });
          return false;
        }
        for (const inst of formData.instructions) {
          if (!inst.description.trim()) {
            toast({
              title: "Erreur",
              description: "Toutes les étapes doivent avoir une description",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handlePrevious = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    try {
      setLoading(true);
      
      // Préparer les données de la recette
      const recipeData: any = {
        title: formData.title,
        description: formData.description,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
        difficulty: formData.difficulty,
        category: formData.category,
        tags: formData.tags,
        ingredients: formData.ingredients,
        instructions: formData.instructions,
        nutrition: formData.nutrition,
        isPublished: true,
      };

      // Ajouter l'image si elle existe (en base64)
      if (formData.image) {
        recipeData.image = formData.image;
      }

      console.log("Sending recipe data:", recipeData);

      const data = await recipesAPI.create(recipeData);
      if (data.success) {
        toast({
          title: "Succès",
          description: "Recette créée avec succès!",
        });
        navigate(`/recipe/${data.data._id || data.data.id}`);
      }
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la recette",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Créer une nouvelle recette</h1>
          <div className="w-24"></div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((stepLabel, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    step === index + 1
                      ? "bg-primary text-primary-foreground"
                      : step > index + 1
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 ${
                  step > index + 1
                    ? "bg-success"
                    : step === index + 1
                    ? "bg-primary"
                    : "bg-muted"
                } ${index === 0 ? "" : "ml-2"}`}
              ></div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            {steps.map((stepLabel, index) => (
              <div key={index} className="flex-1 text-center">
                <p
                  className={`text-xs ${
                    step === index + 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {stepLabel}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: General Information */}
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
              
              <div className="mb-6">
                <Label className="mb-2 block">Image de la recette</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg object-cover"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImagePreview("");
                            setImageFile(null);
                            handleInputChange("image", "");
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                        <label className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Changer
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Cliquez pour ajouter une photo ou glissez-déposez une image
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">JPG, PNG - Max 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la recette *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Tarte aux pommes de grand-mère"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre recette en quelques mots..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prep-time">Temps de préparation (min) *</Label>
                    <Input
                      id="prep-time"
                      type="number"
                      placeholder="30"
                      value={formData.prepTime || ""}
                      onChange={(e) => handleInputChange("prepTime", parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cook-time">Temps de cuisson (min) *</Label>
                    <Input
                      id="cook-time"
                      type="number"
                      placeholder="45"
                      value={formData.cookTime || ""}
                      onChange={(e) => handleInputChange("cookTime", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servings">Nombre de personnes *</Label>
                    <Input
                      id="servings"
                      type="number"
                      placeholder="4"
                      value={formData.servings || ""}
                      onChange={(e) => handleInputChange("servings", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulté *</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => handleInputChange("difficulty", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facile">Facile</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="difficile">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  {categories.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 border rounded flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des catégories...
                    </div>
                  ) : (
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        console.log("Category selected:", value);
                        handleInputChange("category", value);
                      }}
                    >
                      <SelectTrigger className={!formData.category ? "text-muted-foreground" : ""}>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => {
                          const catId = cat._id || cat.id;
                          const catName = cat.name || "Sans nom";
                          console.log("Rendering category:", catId, catName);
                          return (
                            <SelectItem key={catId} value={catId}>
                              {catName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  {categories.length > 0 && !formData.category && (
                    <p className="text-xs text-muted-foreground">
                      {categories.length} catégorie(s) disponible(s)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="végétarien, rapide, économique..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/")}>
                Annuler
              </Button>
              <Button className="bg-gradient-primary" onClick={handleNext}>
                Continuer
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Ingredients */}
        {step === 2 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Ingrédients</h2>
              
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-12 gap-2">
                  <Input
                    placeholder="Quantité"
                    value={newIngredient.quantity}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, quantity: e.target.value })
                    }
                    className="col-span-3"
                  />
                  <Input
                    placeholder="Unité"
                    value={newIngredient.unit}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, unit: e.target.value })
                    }
                    className="col-span-3"
                  />
                  <Input
                    placeholder="Nom de l'ingrédient *"
                    value={newIngredient.name}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, name: e.target.value })
                    }
                    className="col-span-5"
                  />
                  <Button type="button" onClick={handleAddIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.ingredients.length > 0 && (
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        {ingredient.quantity && `${ingredient.quantity} `}
                        {ingredient.unit && `${ingredient.unit} de `}
                        {ingredient.name}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Précédent
              </Button>
              <Button className="bg-gradient-primary" onClick={handleNext}>
                Continuer
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Instructions */}
        {step === 3 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Étapes de préparation</h2>
              
              <div className="space-y-4">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {instruction.step}
                      </div>
                    </div>
                    <Textarea
                      placeholder={`Étape ${instruction.step}...`}
                      value={instruction.description}
                      onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInstruction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddInstruction}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une étape
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Précédent
              </Button>
              <Button className="bg-gradient-primary" onClick={handleNext}>
                Continuer
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review and Publish */}
        {step === 4 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Révision et publication</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Titre</h3>
                  <p>{formData.title}</p>
                </div>

                {formData.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{formData.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Temps total</h3>
                    <p>{formData.prepTime + formData.cookTime} min</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Portions</h3>
                    <p>{formData.servings} personnes</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Difficulté</h3>
                    <p className="capitalize">{formData.difficulty}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Ingrédients ({formData.ingredients.length})</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {formData.ingredients.map((ing, index) => (
                      <li key={index}>
                        {ing.quantity && `${ing.quantity} `}
                        {ing.unit && `${ing.unit} de `}
                        {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Étapes ({formData.instructions.length})</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {formData.instructions.map((inst, index) => (
                      <li key={index}>{inst.description}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Précédent
              </Button>
              <Button
                className="bg-gradient-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publication...
                  </>
                ) : (
                  "Publier la recette"
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateRecipe;
