#!/bin/bash

# Исправление порядка скриптов в HTML файлах
# gameControls.js должна быть ПОСЛЕ модульных скриптов игр

cd "c:\Visual studio\Сайт"

# Список HTML файлов с проблемами
files=(
  "Arcanoid.html"
  "Asteroids.html"
  "Bomberman.html"
  "BubbleShooter.html"
  "PacMan.html"
  "shootingGallery.html"
  "2048.html"
  "hangman.html"
  "runnerGameAnimals.html"
  "SimpleRacing.html"
  "Pong.html"
  "PongCoop.html"
  "hangmanRus.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Заменить порядок скриптов
    sed -i 's/<script src="gameControls.js"><\/script>\n  <script type="module" src="Games\//\n  <script type="module" src="Games\//' "$file"
  fi
done

echo "Исправления применены"
