<?php

// Fichier : config/jwt.php

// ⚠️ Clé secrète utilisée pour signer les tokens.
// Pour un vrai déploiement, mets-la dans une variable d'environnement (.env),
// jamais en dur dans le code versionné sur GitHub.
define('JWT_SECRET', 'primeauto_dev_secret_change_moi_avant_production_2026');

// Durée de validité du token : 2 heures
define('JWT_EXPIRATION_SECONDS', 60 * 60 * 2);
