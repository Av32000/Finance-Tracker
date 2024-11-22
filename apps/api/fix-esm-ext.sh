# Source : GNU/Linux Magazine France N°264

project_dir=$(dirname $(dirname $(dirname $(realpath "$0"))))

api_dir="${project_dir}/dist/api"

# Find and modify all .js files
for file in "$api_dir"/*.js; do
    # Check if any files exist
    [ -e "$file" ] || continue
    
    # Modify local imports starting with ./ or ../
    # But do NOT modify node module imports
    sed -i 's/from "\(\.\{1,2\}\/[^"]*\)"/from "\1.js"/g' "$file"
    
    echo "Processed: $file"
done

echo "Import statement modification complete."