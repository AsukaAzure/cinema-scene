   git clone https://github.com/yourusername/cinema-scene.git
   cd cinema-scene
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your API key:
   ```env
   VITE_SUPABASE_PROJECT_ID="KEY"
    VITE_SUPABASE_PUBLISHABLE_KEY="KEY"
    VITE_SUPABASE_URL="KEY"

   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```text
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Page routes and layouts
│   ├── services/    # API integration logic
│   └── styles/      # Global CSS and Tailwind config
└── package.json
