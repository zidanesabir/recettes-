import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";

interface Category {
  id: string;
  name: string;
  description?: string;
}

const FirestoreTest = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const data: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Category, "id">),
        }));
        setCategories(data);
      } catch (error) {
        console.error("Erreur Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return <p>Chargement des catégories Firestore...</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Catégories depuis Firestore</h2>
      <ul className="list-disc ml-6">
        {categories.map((cat) => (
          <li key={cat.id}>
            <strong>{cat.name}</strong> – {cat.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FirestoreTest;
