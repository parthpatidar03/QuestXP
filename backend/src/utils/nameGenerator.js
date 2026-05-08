const animeCharacters = [
    'Goku', 'Naruto', 'Luffy', 'Zoro', 'Sasuke', 'Itachi', 'Levi', 'Eren', 'Mikasa', 'Light',
    'L', 'Killua', 'Gon', 'Saitama', 'Genos', 'Tanjirou', 'Nezuko', 'Zenitsu', 'Inosuke', 'Rengoku',
    'Gojo', 'Sukuna', 'Yuji', 'Megumi', 'Nobara', 'Deku', 'Bakugo', 'Todoroki', 'AllMight', 'Kirito',
    'Asuna', 'Edward', 'Alphonse', 'Mustang', 'Spike', 'Faye', 'Jet', 'Alucard', 'Sora', 'Shiro'
];

const adjectives = [
    'Shadow', 'Silent', 'Swift', 'Blazing', 'Golden', 'Dark', 'Mystic', 'Epic', 'Legendary', 'Primal',
    'Frost', 'Thunder', 'Storm', 'Wild', 'Zen', 'Void', 'Crystal', 'Iron', 'Crimson', 'Azure'
];

/**
 * Generates a random anime-themed username.
 * Format: AdjectiveAnimeChar#### (e.g. ShadowGoku9421)
 */
const generateRandomUsername = () => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const char = animeCharacters[Math.floor(Math.random() * animeCharacters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${adj}${char}${num}`;
};

module.exports = { generateRandomUsername };
