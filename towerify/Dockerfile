# Dockerfile — Python 3.12, prod, gunicorn
FROM python:3.12-slim

# Préférences locales
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Installer dépendances système utiles
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements first (cache Docker)
COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copier le code
COPY . /app

# Crée dossier pour la DB (permet de monter un volume plus facilement)
RUN mkdir -p /data
ENV TILL_DB=/data/till.db

# Exposer le port interne correspondant au port exposé par gunicorn
EXPOSE 7828

# Commande de démarrage : gunicorn avec nombre de workers basé sur le nombre de CPU
# La substitution est exécutée dans le conteneur au runtime.
CMD ["sh", "-c", "gunicorn -w $(python -c \"import os; print(max(1, os.cpu_count() or 1))\") -b 0.0.0.0:7828 \"app:app\" --access-logfile - --error-logfile -"]
