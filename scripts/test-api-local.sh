#!/bin/bash
# Script de test de l'API Quiz Rush en local
# Usage: ./scripts/test-api-local.sh

set -e

API_URL=${1:-"http://localhost:3000/api"}
echo "🧪 Test de l'API: $API_URL"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0

function test_endpoint() {
  local name=$1
  local method=$2
  local path=$3
  local data=$4
  local expected_status=${5:-200}
  
  test_count=$((test_count + 1))
  echo -n "[$test_count] $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL$path")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data" "$API_URL$path")
  fi
  
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} ($status)"
    pass_count=$((pass_count + 1))
    return 0
  else
    echo -e "${RED}✗${NC} (got $status, expected $expected_status)"
    echo "Response: $body"
    return 1
  fi
}

echo "=== 1. Health Check ==="
test_endpoint "Health" "GET" "/health"
echo ""

echo "=== 2. Auth ==="
test_endpoint "Guest auth" "POST" "/auth/guest" "{}"
echo ""

# Extraire le token de la réponse
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" -d '{}' "$API_URL/auth/guest" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Impossible de récupérer le token${NC}"
  exit 1
fi

echo "Token: ${TOKEN:0:20}..."
echo ""

echo "=== 3. User ==="
test_endpoint "Get user" "GET" "/users/me"
echo ""

echo "=== 4. Quiz ==="
test_endpoint "List categories" "GET" "/quiz/categories"
test_endpoint "Start solo" "POST" "/quiz/solo/start" "{}"

# Récupérer le sessionId
SESSION_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}' "$API_URL/quiz/solo/start")
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$SESSION_ID" ]; then
  echo "Session ID: $SESSION_ID"
  test_endpoint "Answer question" "POST" "/quiz/solo/$SESSION_ID/answer" '{"answer":"A","timeSpent":5}'
fi
echo ""

echo "=== 5. Daily Challenge 🆕 ==="
test_endpoint "Get today's challenge" "GET" "/daily-challenge/today"
test_endpoint "Start daily challenge" "POST" "/daily-challenge/start" "{}"

# Récupérer le sessionId du daily
DAILY_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}' "$API_URL/daily-challenge/start")
DAILY_SESSION_ID=$(echo "$DAILY_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$DAILY_SESSION_ID" ]; then
  echo "Daily Session ID: $DAILY_SESSION_ID"
  test_endpoint "Answer daily question" "POST" "/daily-challenge/answer/$DAILY_SESSION_ID" '{"answer":"A","timeSpent":5}'
fi

test_endpoint "Get daily leaderboard" "GET" "/daily-challenge/leaderboard"
echo ""

echo "=== 6. Leaderboard ==="
test_endpoint "Global leaderboard" "GET" "/leaderboard?type=global"
test_endpoint "Weekly leaderboard" "GET" "/leaderboard?type=weekly"
echo ""

echo "=== 7. Missions ==="
test_endpoint "List missions" "GET" "/missions"
echo ""

echo "=== 8. Analytics ==="
test_endpoint "Track event" "POST" "/analytics/events" '{"name":"test_event","props":{"test":true}}'
echo ""

# Résumé
echo "================================"
echo -e "Tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$((test_count - pass_count))${NC}"
echo "================================"

if [ $pass_count -eq $test_count ]; then
  echo -e "${GREEN}✓ Tous les tests sont passés!${NC}"
  exit 0
else
  echo -e "${RED}✗ Certains tests ont échoué${NC}"
  exit 1
fi
