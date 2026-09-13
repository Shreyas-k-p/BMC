import os
import shutil

src_files = {
    "google_glass.jpg": r"C:\Users\lenovo\.gemini\antigravity-ide\brain\1bfdf4fd-92bd-48d2-bab9-afb8e42c1c3f\google_glass_product_1789278782607.jpg",
    "windows_phone.jpg": r"C:\Users\lenovo\.gemini\antigravity-ide\brain\1bfdf4fd-92bd-48d2-bab9-afb8e42c1c3f\windows_phone_hand_1789278802051.jpg",
    "quibi.jpg": r"C:\Users\lenovo\.gemini\antigravity-ide\brain\1bfdf4fd-92bd-48d2-bab9-afb8e42c1c3f\quibi_phone_app_1789278823753.jpg",
}

dest_dir = r"c:\Users\lenovo\Desktop\ppt\assets"
os.makedirs(dest_dir, exist_ok=True)

for name, src in src_files.items():
    dest = os.path.join(dest_dir, name)
    shutil.copyfile(src, dest)
    print(f"Copied {name} -> {dest}")
