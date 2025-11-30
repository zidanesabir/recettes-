/**
 * Firebase Cloud Functions Backend for Recettes App
 * Migrated from Express + MongoDB → Express + Firestore
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");



// -------------------------------
//  INITIALIZATION
// -------------------------------

admin.initializeApp();
const db = admin.firestore();        // Firestore DB
const auth = admin.auth();           // Firebase Auth
const storage = admin.storage();     // Firebase Storage
const { FieldValue } = admin.firestore;

// Global Cloud Functions config
functions.setGlobalOptions({ maxInstances: 10 });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to fetch user profiles by ids and attach author info
const fetchUsersByIds = async (ids = []) => {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (!uniqueIds.length) return {};

  const userDocs = await Promise.all(
    uniqueIds.map(async (uid) => {
      const snap = await db.collection("users").doc(uid).get();
      return { uid, data: snap.exists ? snap.data() : null };
    })
  );

  return userDocs.reduce((acc, { uid, data }) => {
    if (data) {
      acc[uid] = {
        id: uid,
        username: data.username || data.displayName || data.email || "Auteur inconnu",
        avatar: data.avatar || "",
      };
    }
    return acc;
  }, {});
};

const attachAuthor = async (recipes) => {
  if (!recipes?.length) return recipes;
  const ids = recipes.map((r) => r.authorId).filter(Boolean);
  const map = await fetchUsersByIds(ids);
  return recipes.map((r) => ({
    ...r,
    author: map[r.authorId] || { username: r.authorEmail || "Auteur inconnu" },
  }));
};

// Helper to create a notification
const addNotification = async (userId, payload = {}) => {
  if (!userId) return;
  await db.collection("notifications").add({
    userId,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    ...payload,
  });
};

// -------------------------------
//  AUTH MIDDLEWARE (Firebase ID token)
// -------------------------------
const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const hasBearer = header.startsWith("Bearer ");
    if (!hasBearer) {
      return res.status(401).json({ success: false, message: "Missing Authorization header" });
    }

    const idToken = header.replace("Bearer ", "");
    const decoded = await auth.verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// -------------------------------
//  API ROUTES (RECETTES APP)
// -------------------------------

// =============================
//    GET RECIPES (ORDER SPECIFIC > GENERIC)
// =============================

// Recent
app.get("/api/recipes/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const snap = await db.collection("recipes").orderBy("createdAt", "desc").limit(limit).get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Popular
app.get("/api/recipes/popular", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const snap = await db.collection("recipes").orderBy("likesCount", "desc").limit(limit).get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Favorites (current user)
app.get("/api/recipes/favorites", authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection("users").doc(req.user.uid).get();
    const favorites = (userSnap.data()?.favorites || []).slice(0, 10);
    if (!favorites.length) return res.json({ success: true, data: [] });

    const recipes = await db
      .collection("recipes")
      .where(admin.firestore.FieldPath.documentId(), "in", favorites)
      .get();
    const data = recipes.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Followed authors
app.get("/api/recipes/followed", authMiddleware, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const userSnap = await db.collection("users").doc(req.user.uid).get();
    const following = (userSnap.data()?.following || []).slice(0, 10);
    if (!following.length) return res.json({ success: true, data: [] });
    const snap = await db
      .collection("recipes")
      .where("authorId", "in", following)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// My recipes (current user)
app.get("/api/recipes/my-recipes", authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection("recipes")
      .where("authorId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// By userId
app.get("/api/recipes/user/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("recipes")
      .where("authorId", "==", req.params.userId)
      .orderBy("createdAt", "desc")
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// All recipes (with filters/search)
app.get("/api/recipes", async (req, res) => {
  try {
    const { category, difficulty, search, limit = 50 } = req.query;
    const limitNum = Number(limit);
    const baseRef = db.collection("recipes");
    const queryRefs = [];
    const stringCandidates = new Set();
    const refCandidates = new Set();

   
    if (category) {
      const catParam = String(category).trim();
      const slugParam = catParam.toLowerCase();
      stringCandidates.add(catParam);
      stringCandidates.add(slugParam);

    
      const categoryDoc = await db.collection("categories").doc(catParam).get();
      if (categoryDoc.exists) {
        stringCandidates.add(categoryDoc.id);
        refCandidates.add(categoryDoc.ref);
        const data = categoryDoc.data();
        if (data?.slug) {
          stringCandidates.add(String(data.slug));
          stringCandidates.add(String(data.slug).toLowerCase());
        }
        if (data?.name) {
          stringCandidates.add(String(data.name));
          stringCandidates.add(String(data.name).toLowerCase());
        }
      }


      const slugSnap = await db
        .collection("categories")
        .where("slug", "==", slugParam)
        .limit(1)
        .get();
      if (!slugSnap.empty) {
        stringCandidates.add(slugSnap.docs[0].id);
        refCandidates.add(slugSnap.docs[0].ref);
        const data = slugSnap.docs[0].data();
        if (data?.slug) {
          stringCandidates.add(String(data.slug));
          stringCandidates.add(String(data.slug).toLowerCase());
        }
        if (data?.name) {
          stringCandidates.add(String(data.name));
          stringCandidates.add(String(data.name).toLowerCase());
        }
      } else {

        const allCats = await db.collection("categories").limit(200).get();
        allCats.docs.forEach((doc) => {
          const data = doc.data();
          const slug = (data?.slug || "").toString();
          const name = (data?.name || "").toString();
          if (slug.toLowerCase() === slugParam || name.toLowerCase() === slugParam) {
            stringCandidates.add(doc.id);
            refCandidates.add(doc.ref);
            if (slug) {
              stringCandidates.add(slug);
              stringCandidates.add(slug.toLowerCase());
            }
            if (name) {
              stringCandidates.add(name);
              stringCandidates.add(name.toLowerCase());
            }
          }
        });
      }
    }

    // Helper to build a query on a specific field for a given set of values (strings or refs)
    const buildQuery = (field, values) => {
      let q = baseRef;
      if (category && values?.length) {
        q = values.length > 1
          ? q.where(field, "in", values.slice(0, 10)) // Firestore "in" max 10 values
          : q.where(field, "==", values[0]);
      }
      if (difficulty) {
        q = q.where("difficulty", "==", difficulty);
      }
      return q.orderBy("createdAt", "desc").limit(limitNum);
    };

    // Query on both possible fields (category id or stored slug/name), plus legacy field categorySlug
    if (category) {
      const stringVals = Array.from(stringCandidates);
      const refVals = Array.from(refCandidates);
      const primaryString = buildQuery("category", stringVals);
      if (primaryString) queryRefs.push(primaryString);
      const primaryRef = refVals.length ? buildQuery("category", refVals) : null;
      if (primaryRef) queryRefs.push(primaryRef);
      const slugString = buildQuery("categorySlug", stringVals);
      if (slugString) queryRefs.push(slugString);
    }

    // If no category filter, just run one query
    if (!category) {
      queryRefs.push(buildQuery("category", []));
    }

    const snapshots = await Promise.all(queryRefs.filter(Boolean).map((q) => q.get()));
    const merged = new Map();
    snapshots.forEach((snap) => {
      snap.docs.forEach((doc) => merged.set(doc.id, { id: doc.id, ...doc.data() }));
    });

    let data = Array.from(merged.values());

    // Fallback: if nothing matched and a category was provided, fetch a larger page and filter in-memory
    if (!data.length && category) {
      const fallbackSnap = await baseRef.orderBy("createdAt", "desc").limit(Math.max(limitNum, 200)).get();
      const catParam = String(category).trim();
      const slugParam = catParam.toLowerCase();
      const matchers = new Set([catParam, slugParam, ...stringCandidates]);

      const fallback = fallbackSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((r) => {
          const values = [
            r.category,
            r.categorySlug,
            r.categoryName,
            r.category_id,
            r.categoryId,
            r.category?.id,
            r.category?.slug,
            r.category?.name,
          ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase());
          return values.some((v) => matchers.has(v));
        });

      fallback.forEach((r) => merged.set(r.id, r));
      data = Array.from(merged.values());
    }

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((r) => (r.title || "").toLowerCase().includes(lower));
    }

    // Sort after merge to ensure correct ordering when multiple queries are combined
    data = data
      .sort((a, b) => {
        const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return bTs - aTs;
      })
      .slice(0, limitNum);

    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.get("/api/recipes/:id", async (req, res) => {
  try {
    const doc = await db.collection("recipes").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    const recipe = { id: doc.id, ...doc.data() };
    const [withAuthor] = await attachAuthor([recipe]);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================
//    ADD NEW RECIPE
// =============================
app.post("/api/recipes", authMiddleware, async (req, res) => {
  try {
    const data = {
      ...req.body,
      category: req.body.category || req.body.categorySlug || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      authorId: req.user?.uid || null,
      authorEmail: req.user?.email || null,
      likes: [],
      likesCount: 0,
      favoritesCount: 0,
      bookmarksCount: 0,
    };

    const doc = await db.collection("recipes").add(data);

    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE recipe (author only)
app.put("/api/recipes/:id", authMiddleware, async (req, res) => {
  try {
    const ref = db.collection("recipes").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    const recipe = snap.data();
    if (recipe.authorId && recipe.authorId !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Not allowed to edit this recipe" });
    }
    await ref.update({
      ...req.body,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: "Recipe updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE recipe (author only)
app.delete("/api/recipes/:id", authMiddleware, async (req, res) => {
  try {
    const ref = db.collection("recipes").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    const recipe = snap.data();
    if (recipe.authorId && recipe.authorId !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Not allowed to delete this recipe" });
    }
    await ref.delete();
    res.json({ success: true, message: "Recipe deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// LIKE/UNLIKE recipe
app.put("/api/recipes/:id/like", authMiddleware, async (req, res) => {
  try {
    const recipeRef = db.collection("recipes").doc(req.params.id);
    const snap = await recipeRef.get();
    if (!snap.exists) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    const recipe = snap.data();
    const likes = recipe.likes || [];
    const hasLiked = likes.includes(req.user.uid);
    const update = hasLiked
      ? {
          likes: FieldValue.arrayRemove(req.user.uid),
          likesCount: Math.max((recipe.likesCount || likes.length) - 1, 0),
        }
      : {
          likes: FieldValue.arrayUnion(req.user.uid),
          likesCount: (recipe.likesCount || likes.length) + 1,
        };
    await recipeRef.update(update);
    const updated = await recipeRef.get();

    // Notify recipe author on new like (not on unlike and not self-like)
    if (!hasLiked && recipe.authorId && recipe.authorId !== req.user.uid) {
      await addNotification(recipe.authorId, {
        type: "recipe_like",
        recipeId: req.params.id,
        actorId: req.user.uid,
        message: "Quelqu'un a aimé votre recette",
      });
    }

    res.json({
      success: true,
      liked: !hasLiked,
      data: { likes: updated.data().likes || [], likesCount: updated.data().likesCount || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RECIPES BY USER
app.get("/api/recipes/user/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("recipes")
      .where("authorId", "==", req.params.userId)
      .orderBy("createdAt", "desc")
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RECENT RECIPES
app.get("/api/recipes/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const snap = await db.collection("recipes").orderBy("createdAt", "desc").limit(limit).get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POPULAR (by likesCount)
app.get("/api/recipes/popular", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const snap = await db.collection("recipes").orderBy("likesCount", "desc").limit(limit).get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// FAVORITES (recipes saved by current user)
app.get("/api/recipes/favorites", authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection("users").doc(req.user.uid).get();
    const favorites = (userSnap.data()?.favorites || []).slice(0, 10);
    if (!favorites.length) return res.json({ success: true, data: [] });

    const recipes = await db.collection("recipes").where(admin.firestore.FieldPath.documentId(), "in", favorites).get();
    const data = recipes.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// FOLLOWED authors' recipes
app.get("/api/recipes/followed", authMiddleware, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const userSnap = await db.collection("users").doc(req.user.uid).get();
    const following = (userSnap.data()?.following || []).slice(0, 10);
    if (!following.length) return res.json({ success: true, data: [] });
    const snap = await db
      .collection("recipes")
      .where("authorId", "in", following)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// MY RECIPES (current user)
app.get("/api/recipes/my-recipes", authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection("recipes")
      .where("authorId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const withAuthor = await attachAuthor(data);
    res.json({ success: true, data: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================
//   CATEGORIES
// =============================

// GET all categories
app.get("/api/categories", async (req, res) => {
  try {
    const snapshot = await db.collection("categories").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD category
app.post("/api/categories", authMiddleware, async (req, res) => {
  try {
    const doc = await db.collection("categories").add(req.body);
    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET category by id
app.get("/api/categories/:id", async (req, res) => {
  try {
    const doc = await db.collection("categories").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================
//    COMMENTS
// =============================

// GET comments for a recipe
app.get("/api/recipes/:id/comments", async (req, res) => {
  try {
    const snapshot = await db
      .collection("recipes")
      .doc(req.params.id)
      .collection("comments")
      .orderBy("createdAt", "desc")
      .get();

    const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Attach author info
    const userIds = comments.map(c => c.userId).filter(Boolean);
    const users = await fetchUsersByIds(userIds);

    const withAuthor = comments.map((comment) => ({
      ...comment,
      author: users[comment.userId] || {
        username: "Utilisateur inconnu",
        avatar: "",
      }
    }));
    res.json({ success: true, data: comments });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD comment
app.post("/api/recipes/:id/comments", authMiddleware, async (req, res) => {
  try {
    const newComment = {
      text: req.body.text || req.body.content,
      userId: req.user?.uid || req.body.userId || null,
      authorId: req.user?.uid || req.body.userId || null,
      rating: req.body.rating || null,
      createdAt: FieldValue.serverTimestamp(),
      likes: [],
      replies: [],
    };

    const recipeRef = db.collection("recipes").doc(req.params.id);
    const recipeSnap = await recipeRef.get();
    if (!recipeSnap.exists) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    await recipeRef.collection("comments").add(newComment);

    // Notify recipe author about the new comment (if not self-comment)
    const recipe = recipeSnap.data();
    if (recipe.authorId && recipe.authorId !== req.user.uid) {
      await addNotification(recipe.authorId, {
        type: "comment",
        recipeId: req.params.id,
        actorId: req.user.uid,
        message: "Nouveau commentaire sur votre recette",
      });
    }

    res.json({ success: true, message: "Comment added" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// LIKE comment
app.put("/api/comments/:id/like", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: "recipeId required" });
    const commentRef = db.collection("recipes").doc(recipeId).collection("comments").doc(req.params.id);
    const snap = await commentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "Comment not found" });
    const data = snap.data();
    const likes = data.likes || [];
    const hasLiked = likes.includes(req.user.uid);
    await commentRef.update({
      likes: hasLiked ? FieldValue.arrayRemove(req.user.uid) : FieldValue.arrayUnion(req.user.uid),
    });
    res.json({ success: true, liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD reply to comment
app.post("/api/comments/:id/reply", authMiddleware, async (req, res) => {
  try {
    const { recipeId, content } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: "recipeId required" });
    const commentRef = db.collection("recipes").doc(recipeId).collection("comments").doc(req.params.id);
    const snap = await commentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "Comment not found" });
    const reply = {
      id: db.collection("_").doc().id,
      text: content,
      userId: req.user.uid,
      createdAt: FieldValue.serverTimestamp(),
    };
    await commentRef.update({
      replies: FieldValue.arrayUnion(reply),
    });

    // Notify original commenter about a reply (if not self-reply)
    const comment = snap.data();
    if (comment.userId && comment.userId !== req.user.uid) {
      await addNotification(comment.userId, {
        type: "comment_reply",
        recipeId,
        actorId: req.user.uid,
        message: "Quelqu'un a répondu à votre commentaire",
      });
    }

    res.json({ success: true, message: "Reply added" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE comment (author only)
app.put("/api/comments/:id", authMiddleware, async (req, res) => {
  try {
    const { recipeId, content } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: "recipeId required" });
    const commentRef = db.collection("recipes").doc(recipeId).collection("comments").doc(req.params.id);
    const snap = await commentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "Comment not found" });
    const data = snap.data();
    if (data.userId && data.userId !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    await commentRef.update({ text: content });
    res.json({ success: true, message: "Comment updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE comment (author only)
app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: "recipeId required" });
    const commentRef = db.collection("recipes").doc(recipeId).collection("comments").doc(req.params.id);
    const snap = await commentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "Comment not found" });
    const data = snap.data();
    if (data.userId && data.userId !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    await commentRef.delete();
    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================
//    USER SYSTEM
// =============================

// GET user profile
app.get("/api/users/:id", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: doc.data() });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE user profile
app.put("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.uid !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not allowed to update this user" });
    }

    await db.collection("users").doc(req.params.id).set(
      {
        ...req.body,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    res.json({ success: true, message: "User updated" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TOGGLE favorite
app.put("/api/users/:id/favorites", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: "recipeId required" });
    if (req.user.uid !== req.params.id) return res.status(403).json({ success: false, message: "Not allowed" });
    const userRef = db.collection("users").doc(req.params.id);
    const snap = await userRef.get();
    const favorites = snap.data()?.favorites || [];
    const isFavorite = favorites.includes(recipeId);
    await userRef.update({
      favorites: isFavorite ? FieldValue.arrayRemove(recipeId) : FieldValue.arrayUnion(recipeId),
    });
    // also bump counter on recipe
    const recipeRef = db.collection("recipes").doc(recipeId);
    const recipeSnap = await recipeRef.get();
    if (recipeSnap.exists) {
      const count = recipeSnap.data().favoritesCount || 0;
      await recipeRef.update({
        favoritesCount: isFavorite ? Math.max(count - 1, 0) : count + 1,
      });
      if (!isFavorite && recipeSnap.data().authorId && recipeSnap.data().authorId !== req.user.uid) {
        await addNotification(recipeSnap.data().authorId, {
          type: "favorite",
          recipeId,
          actorId: req.user.uid,
          message: "Quelqu'un a ajouté votre recette aux favoris",
        });
      }
    }
    res.json({ success: true, isFavorite: !isFavorite });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TOGGLE bookmark
app.put("/api/users/:id/bookmarks", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: "recipeId required" });
    if (req.user.uid !== req.params.id) return res.status(403).json({ success: false, message: "Not allowed" });
    const userRef = db.collection("users").doc(req.params.id);
    const snap = await userRef.get();
    const bookmarks = snap.data()?.bookmarks || [];
    const isBookmarked = bookmarks.includes(recipeId);
    await userRef.update({
      bookmarks: isBookmarked ? FieldValue.arrayRemove(recipeId) : FieldValue.arrayUnion(recipeId),
    });
    res.json({ success: true, isBookmarked: !isBookmarked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// FOLLOW/UNFOLLOW user
app.put("/api/users/:id/follow", authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const actorId = req.user.uid;
    if (targetId === actorId) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }
    const actorRef = db.collection("users").doc(actorId);
    const targetRef = db.collection("users").doc(targetId);
    const actorSnap = await actorRef.get();
    const following = actorSnap.data()?.following || [];
    const isFollowing = following.includes(targetId);
    await actorRef.update({
      following: isFollowing ? FieldValue.arrayRemove(targetId) : FieldValue.arrayUnion(targetId),
    });
    await targetRef.update({
      followers: isFollowing ? FieldValue.arrayRemove(actorId) : FieldValue.arrayUnion(actorId),
    });

    // Notify target user on new follow
    if (!isFollowing) {
      await addNotification(targetId, {
        type: "follow",
        actorId,
        message: "Un nouvel utilisateur vous suit",
      });
    }
    res.json({ success: true, isFollowing: !isFollowing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/users/:id/followers", async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.params.id).get();
    const followers = snap.data()?.followers || [];
    res.json({ success: true, data: followers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/users/:id/following", async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.params.id).get();
    const following = snap.data()?.following || [];
    res.json({ success: true, data: following });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================
//    NOTIFICATIONS (minimal)
// =============================
app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection("notifications")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection("notifications")
      .where("userId", "==", req.user.uid)
      .where("read", "==", false)
      .get();
    res.json({ success: true, count: snap.size });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const ref = db.collection("notifications").doc(req.params.id);
    await ref.update({ read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/notifications/read-all", authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection("notifications")
      .where("userId", "==", req.user.uid)
      .where("read", "==", false)
      .get();
    const batch = db.batch();
    snap.forEach((doc) => batch.update(doc.ref, { read: true }));
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/notifications/:id", authMiddleware, async (req, res) => {
  try {
    await db.collection("notifications").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------
//  EXPORT EXPRESS APP AS CLOUDFUNCTION
// -------------------------------
exports.api = functions.https.onRequest(app);