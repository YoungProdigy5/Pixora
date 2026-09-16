/* =========================================================
   PIXORA — WALLPAPER DATABASE
   =========================================================
   Capacity:
   50 wallpapers per category for the current version.
   The system can later be expanded to 200+ per category.

   IMPORTANT:
   Only add wallpapers when the actual image file exists.
   ========================================================= */


/* =========================================================
   PIXORA CATEGORIES
   ========================================================= */

const pixoraCategories = [

    {
        id: "anime",
        name: "Anime",
        icon: "🎌",
        maxWallpapers: 50
    },

    {
        id: "gaming",
        name: "Gaming",
        icon: "🎮",
        maxWallpapers: 50
    },

    {
        id: "cars",
        name: "Cars",
        icon: "🚗",
        maxWallpapers: 50
    },

    {
        id: "sports",
        name: "Sports",
        icon: "⚽",
        maxWallpapers: 50
    },

    {
        id: "nature",
        name: "Nature",
        icon: "🌿",
        maxWallpapers: 50
    },

    {
        id: "space",
        name: "Space",
        icon: "🚀",
        maxWallpapers: 50
    },

    {
        id: "luxury",
        name: "Luxury",
        icon: "💎",
        maxWallpapers: 50
    },

    {
        id: "technology",
        name: "Technology",
        icon: "💻",
        maxWallpapers: 50
    },

    {
        id: "movies",
        name: "Movies",
        icon: "🎬",
        maxWallpapers: 50
    },

    {
        id: "music",
        name: "Music",
        icon: "🎵",
        maxWallpapers: 50
    },

    {
        id: "amoled",
        name: "AMOLED",
        icon: "🖤",
        maxWallpapers: 50
    },

    {
        id: "aesthetic",
        name: "Aesthetic",
        icon: "✨",
        maxWallpapers: 50
    },

    {
        id: "horror",
        name: "Horror",
        icon: "👻",
        maxWallpapers: 50
    },

    {
        id: "fantasy",
        name: "Fantasy",
        icon: "🧙",
        maxWallpapers: 50
    },

    {
        id: "travel",
        name: "Travel",
        icon: "✈️",
        maxWallpapers: 50
    },

    {
        id: "fitness",
        name: "Fitness",
        icon: "💪",
        maxWallpapers: 50
    },

    {
        id: "animals",
        name: "Animals",
        icon: "🐺",
        maxWallpapers: 50
    },

    {
        id: "cities",
        name: "Cities",
        icon: "🌆",
        maxWallpapers: 50
    },

    {
        id: "love",
        name: "Love",
        icon: "❤️",
        maxWallpapers: 50
    },

    {
        id: "retro",
        name: "Retro",
        icon: "📼",
        maxWallpapers: 50
    },

    {
        id: "cute",
        name: "Cute",
        icon: "🐼",
        maxWallpapers: 50
    },

    {
        id: "art",
        name: "Art",
        icon: "🎨",
        maxWallpapers: 50
    }

];


/* =========================================================
   PIXORA WALLPAPERS
   =========================================================
   Add each real wallpaper as a separate object.

   Example:

   {
       id: "anime-002",
       title: "Another Anime Wallpaper",
       category: "anime",
       image: "wallpapers/anime/example.jpeg",
       keywords: [
           "anime",
           "character",
           "manga"
       ]
   }

   The ID must be unique.
   ========================================================= */

const pixoraWallpapers = [

    /* =====================================================
       ANIME
       ===================================================== */

    {
        id: "anime-001",

        title: "Okarun Dandadan",

        category: "anime",

        image:
            "wallpapers/Anime-Okarun Wallpaper -dandadan -okarun.jpeg",

        keywords: [
            "anime",
            "okarun",
            "dandadan",
            "manga"
        ],

        description:
            "Okarun from Dandadan."
    }

];


/* =========================================================
   MAKE DATA AVAILABLE TO SCRIPT.JS
   ========================================================= */

window.pixoraCategories =
    pixoraCategories;

window.pixoraWallpapers =
    pixoraWallpapers;
