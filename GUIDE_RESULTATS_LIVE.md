# 📊 Configuration des Résultats en Live - Backyard Ultra Valais 2026

## 🎯 Vue d'ensemble

Ce système permet de mettre à jour les résultats en temps réel via Google Sheets pendant la course.

---

## 📝 Étape 1 : Créer le Google Sheet

### 1. Créez un nouveau Google Sheet

Allez sur [sheets.google.com](https://sheets.google.com) et créez un nouveau document.

### 2. Nommez l'onglet

Nommez le premier onglet **"Résultats"** (important!)

### 3. Créez les colonnes suivantes (exactement dans cet ordre) :

| A    | B   | C      | D     | E       | F        |
| ---- | --- | ------ | ----- | ------- | -------- |
| Rang | Nom | Prénom | Genre | Boucles | Distance |

### 4. Exemple de données :

```
Rang    Nom         Prénom      Genre   Boucles   Distance
1       Dupont      Jean        M       15        100.5
2       Martin      Sophie      F       14        93.8
3       Bernard     Pierre      M       14        93.8
DNS     Petit       Marc        M       DNS       -
```

**Notes importantes :**

- Genre doit être **M** ou **F** (majuscule)
- Pour DNS : mettre "DNS" dans Boucles et "-" dans Distance
- Distance en km avec point décimal (ex: 100.5)

---

## 🔑 Étape 2 : Configurer le partage

### 1. Cliquez sur "Partager" (en haut à droite)

### 2. Changez l'accès à "Tous les utilisateurs avec le lien"

### 3. Assurez-vous que le rôle est "Lecteur"

### 4. Copiez le lien du Sheet

---

## 🛠️ Étape 3 : Configuration technique

### 1. Extraire l'ID du Sheet

Dans l'URL de votre Google Sheet, copiez la partie entre `/d/` et `/edit` :

```
https://docs.google.com/spreadsheets/d/VOTRE_SHEET_ID_ICI/edit
                                        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
```

### 2. Modifier le fichier JavaScript

Ouvrez le fichier : `js/live-results.js`

Remplacez cette ligne (ligne 12) :

```javascript
const SHEET_ID = "VOTRE_SHEET_ID_ICI";
```

Par :

```javascript
const SHEET_ID = "votre_id_copié";
```

### 3. Vérifiez le nom de l'onglet

Si vous avez nommé l'onglet différemment de "Résultats", modifiez la ligne 13 :

```javascript
const SHEET_NAME = "Résultats";
```

---

## 🚀 Étape 4 : Tester

### 1. Ouvrez la page des résultats 2026

```
http://votre-site.com/resultats/2026
```

### 2. Vérifications

- ✅ Le badge "LIVE" clignote
- ✅ Les résultats s'affichent
- ✅ L'heure de dernière mise à jour est visible
- ✅ Le graphique se met à jour

### 3. Test de mise à jour

1. Ajoutez une ligne dans votre Google Sheet
2. Attendez 30 secondes (rafraîchissement automatique)
3. La page devrait se mettre à jour automatiquement

---

## 📱 Pendant la course

### Mise à jour simple :

1. Ouvrez votre Google Sheet sur votre téléphone ou ordinateur
2. Ajoutez/modifiez les lignes au fur et à mesure
3. Les changements apparaîtront automatiquement sur le site après 30 secondes maximum

### Conseils :

- 📝 Préparez les lignes avec les noms à l'avance
- 🔄 Mettez uniquement à jour les colonnes Boucles et Distance
- 💾 Le Google Sheet sauvegarde automatiquement
- 📶 Assurez-vous d'avoir une connexion Internet stable

---

## ⚙️ Personnalisation

### Changer l'intervalle de rafraîchissement

Dans `resultats/2026/index.html`, ligne avec `startAutoRefresh` :

```javascript
LiveResults.startAutoRefresh(30); // 30 secondes par défaut
```

Changez 30 par le nombre de secondes souhaité (ex: 15, 60, etc.)

### Désactiver le rafraîchissement automatique

Commentez ou supprimez cette ligne dans le fichier 2026/index.html

---

## 🐛 Dépannage

### Les résultats ne s'affichent pas

1. ✅ Vérifiez que le SHEET_ID est correct
2. ✅ Vérifiez que le partage est activé ("Tous les utilisateurs avec le lien")
3. ✅ Vérifiez le nom de l'onglet ("Résultats")
4. ✅ Ouvrez la console du navigateur (F12) pour voir les erreurs

### Les données sont incorrectes

1. ✅ Vérifiez l'ordre des colonnes (Rang, Nom, Prénom, Genre, Boucles, Distance)
2. ✅ Vérifiez que Genre est M ou F (majuscule)
3. ✅ Vérifiez le format des nombres (point pour les décimales)

### Le rafraîchissement ne fonctionne pas

1. ✅ Videz le cache du navigateur (Ctrl+Shift+R)
2. ✅ Vérifiez la console pour les erreurs JavaScript

---

## 📞 Support

En cas de problème, vérifiez :

1. La console du navigateur (F12 > Console)
2. Les paramètres de partage Google Sheets
3. L'ID du Sheet dans le fichier JavaScript

---

## 🎉 C'est prêt !

Votre système de résultats en live est configuré. Vous pouvez maintenant mettre à jour les résultats simplement en éditant votre Google Sheet pendant la course !

**Bonne course ! 🏃‍♂️🏃‍♀️**
