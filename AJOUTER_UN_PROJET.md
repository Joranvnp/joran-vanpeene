# Ajouter un projet au portfolio

Les projets sont gérés dans **data/projects.json**. Leur ordre dans le fichier est leur ordre sur le site.

## Depuis GitHub, sans installer de logiciel

1. Dans le dépôt Joranvnp/joran-vanpeene, ouvrez `public/projects`, puis **Add file → Upload files**. Ajoutez une capture PNG, JPG, WebP ou AVIF, idéalement 1600 × 1200 pixels et moins de 500 Ko. Validez sur `main`.
2. Ouvrez `data/projects.json`, cliquez sur le crayon et remplacez un des projets « à venir » par vos informations.
3. Validez la modification sur `main`. Vercel reconstruit et actualise automatiquement le site ; attendez le statut **Ready**.

Exemple à adapter (ne pas publier tel quel) :

```json
{
  "id": "nom-du-projet",
  "title": "Nom de mon projet",
  "category": "Site vitrine · Design & développement",
  "description": "Le besoin du client et ce que j’ai réalisé, en une ou deux phrases.",
  "year": "2026",
  "image": "/projects/mon-projet.webp",
  "imageAlt": "Page d’accueil du site Nom de mon projet",
  "url": "https://adresse-reelle-du-projet.fr",
  "tags": ["Next.js", "React"],
  "color": "#466b62",
  "comingSoon": false,
  "visible": true
}
```

- Remplacez une entrée existante ou ajoutez l’objet dans le tableau, séparé des autres par une virgule. Chaque `id` doit être unique.
- `comingSoon: false` indique que la présentation est prête. `true` affiche « Bientôt » et désactive le lien.
- `visible: false` masque complètement le projet.
- `url` peut rester vide si le site n’est pas public. Un lien renseigné s’ouvre dans un nouvel onglet.
- `image` peut rester vide : un aperçu typographique honnête remplace la capture. Les images doivent être dans `public/projects`.
- `color` est la couleur de fond de l’aperçu.
- Ne revendiquez que votre rôle réel ; utilisez des captures et des liens que vous avez le droit de publier.

Sur ordinateur, les aperçus suivent le pointeur avec une transition entre les projets. Sur téléphone et en mouvement réduit, les aperçus sont directement dans la page. Le clavier permet aussi d’afficher l’aperçu en donnant le focus à une ligne.

Vous pouvez également transmettre à votre assistant le nom, le lien, une capture et quelques mots sur votre rôle pour qu’il fasse l’ajout.

Référence d’animation : « Project Gallery Mouse Hover », Olivier Larose. Implémentation adaptée au portfolio avec React et CSS, sans reprendre les images de sa démonstration.
https://blog.olivierlarose.com/tutorials/project-gallery-mouse-hover
