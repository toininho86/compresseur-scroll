# Compresseur scroll · Scroll compressor

Dossier technique bilingue (FR / EN) d'un compresseur scroll de climatisation automobile — SAÉ 1.1 « Analyse d'un produit grand public », BUT GMP 1.

Bilingual (FR / EN) technical file on an automotive A/C scroll compressor — SAÉ 1.1 "Consumer product analysis", BUT GMP year 1.

## Contenu · Contents

| | FR | EN |
|---|---|---|
| 01 | Présentation fonctionnelle, boucle de clim, bête à cornes, fonctions FP/FC | Functional overview, A/C loop, need statement, functions |
| 02 | Fonctionnement : poches calculées en temps réel + diagramme P‑V | How it works: pockets computed in real time + P‑V diagram |
| 03 | Vue éclatée 3D interactive, repères numérotés, nomenclature des 38 pièces CATIA | Interactive 3D exploded view, numbered balloons, 38-part CATIA bill of materials |
| 04 | Poulie débrayable en coupe 3D | Clutch pulley in 3D section |
| 05 | Graphe de montage animé en 3D (montage / démontage) | 3D animated assembly chart (assembly / disassembly) |
| 06 | Schéma cinématique et liaisons | Kinematic diagram and joints |
| 07–09 | Choix techniques, matériaux (calcul de masse volumique), électroaimant | Design choices, materials (density calculator), electromagnet |
| 10 | Vidéo de présentation (72 s, sous-titres FR + EN) | Presentation video (72 s, FR + EN captions) |
| 11 | Quiz et lexique FR ⇄ EN | Quiz and FR ⇄ EN glossary |

## Fichiers · Files

- `index.html` — le site complet (une seule page) · the whole site (single page)
- `scroll-compressor.mp4` — la vidéo · the video
- `src/model.js` — modèle 3D procédural et géométrie des spirales (développante de cercle) · procedural 3D model and involute scroll geometry
- `src/site.html` — source de la page · page source
- `src/video.html` — rendu image par image de la vidéo (WebCodecs) · frame-by-frame video renderer (WebCodecs)
- `src/build.ps1` — assemble `src/` en `index.html` · builds `index.html` from `src/`

Le modèle 3D est redessiné en code à partir de la nomenclature CATIA du TP : formes simplifiées, pas à l'échelle exacte. Les valeurs marquées « Exemple » sont à remplacer par les mesures de TP.

The 3D model is redrawn in code from the lab's CATIA bill of materials: simplified shapes, not to exact scale. Values marked "Example" are placeholders for lab measurements.
