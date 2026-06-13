// ===============================
// AUTH.JS — Persistent Identity
// ===============================

// Generate a random nickname (Colour + Animal + Number)
function generateNickname() {

    const colours = [
        "Blue","Red","Green","Yellow","Purple","Orange","Silver","Neon","Aqua","Teal",
        "Crimson","Scarlet","Golden","Bronze","Emerald","Sapphire","Ruby","Ivory","Jet",
        "Navy","Sky","Mint","Lime","Cyan","Magenta","Violet","Indigo","Maroon","Peach",
        "Coral","Sand","Olive","Steel","Charcoal","Lavender","Turquoise","Amber","Frost","Shadow"
    ];

    const animals = [
        "Falcon","Tiger","Wolf","Eagle","Panther","Lion","Hawk","Shark","Bear","Cobra",
        "Jaguar","Puma","Leopard","Raven","Fox","Owl","Stallion","Viper","Rhino","Bison",
        "Cheetah","Cougar","Falcon","Badger","Lynx","Buffalo","Crane","Heron","Stingray",
        "Mamba","Gorilla","Hyena","Mustang","Raptor","Talon","Condor","Wolverine","Python","Falcon"
    ];

    const colour = colours[Math.floor(Math.random() * colours.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 900) + 100;

    return `${colour}${animal}${number}`;
}

// Load or create persistent device ID
export function getDeviceID() {
    let id = localStorage.getItem("deviceID");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("deviceID", id);
    }
    return id;
}

// Load or create persistent nickname
export function getNickname() {
    let name = localStorage.getItem("nickname");
    if (!name) {
        name = generateNickname();
        localStorage.setItem("nickname", name);
    }
    return name;
}

// Clear identity (used when session ends or logout)
export function clearIdentity() {
    localStorage.removeItem("deviceID");
    localStorage.removeItem("nickname");
    localStorage.removeItem("sessionCode");
}
