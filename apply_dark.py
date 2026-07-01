import os
import glob

# Mapping of light mode tailwind classes to their dark mode equivalents
# We append the dark mode class immediately after the light mode class
class_map = {
    "bg-white": "bg-white dark:bg-[#0B1120]",
    "bg-[#F8FAFC]": "bg-[#F8FAFC] dark:bg-[#1E293B]",
    "border-[#E2E8F0]": "border-[#E2E8F0] dark:border-[#334155]",
    "text-[#0F172A]": "text-[#0F172A] dark:text-[#F8FAFC]",
    "text-[#64748B]": "text-[#64748B] dark:text-[#94A3B8]",
    "text-[#1E293B]": "text-[#1E293B] dark:text-[#E2E8F0]",
    "hover:bg-[#F8FAFC]": "hover:bg-[#F8FAFC] dark:hover:bg-[#334155]",
    "divide-[#E2E8F0]": "divide-[#E2E8F0] dark:divide-[#334155]",
    "text-[#334155]": "text-[#334155] dark:text-[#CBD5E1]",
    "bg-slate-50": "bg-slate-50 dark:bg-slate-800",
    "text-slate-500": "text-slate-500 dark:text-slate-400"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Simple string replacement (to avoid regex complexity, just replace exact strings)
    # Be careful not to replace something that already has dark: applied (if script runs twice)
    for light, both in class_map.items():
        # First remove any existing mapping if we ran this script before
        content = content.replace(both, light)
        
    for light, both in class_map.items():
        # Apply mapping
        content = content.replace(light, both)
        
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

if __name__ == "__main__":
    base_dir = "d:/FSD/Flying_wings/frontend/src"
    jsx_files = glob.glob(f"{base_dir}/**/*.jsx", recursive=True)
    for f in jsx_files:
        process_file(f)
    print("Done applying dark mode variants.")
