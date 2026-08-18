#!/bin/bash

echo "🦖 Darling Bot (Zero Two Edition) - Inicializando..."

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo "⚠️ Arquivo .env não encontrado! Copiando do .env.example..."
    cp .env.example .env
    echo "❌ Por favor, preencha o arquivo .env com suas credenciais e rode o script novamente."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🏗️ Compilando projeto (TypeScript)..."
npm run build

echo "🚀 Sincronizando Slash Commands..."
npm run deploy

echo "✨ Iniciando a Zero Two..."
npm start
