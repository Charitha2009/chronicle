#!/bin/bash

echo "🤖 Setting up AI integration for Chronicle..."

# Install OpenAI dependency in API
echo "📦 Installing OpenAI dependency..."
cd apps/api
npm install openai@^4.67.3

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating .env.example..."
    cat > .env.example << EOF
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=4000
EOF
    echo "📝 Please copy .env.example to .env and add your API keys"
else
    echo "✅ .env file found"
fi

echo "🎉 AI integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your OpenAI API key to apps/api/.env"
echo "2. Restart the API server: npm run dev"
echo "3. Test the AI features in the character selection page"
echo ""
echo "For more information, see AI_INTEGRATION.md"
