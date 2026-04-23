import json
import os

def clean_channels():
    file_path = r'd:\Desarrollos Programas Personales\StreamTv\public\channels.json'
    if not os.path.exists(file_path):
        print("File not found")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_count = len(data['channels'])
    cleaned_channels = []
    seen_urls = set()

    for ch in data['channels']:
        name = ch.get('name', '').lower()
        category = ch.get('category', '').lower()
        url = ch.get('url', '')

        # Always keep Music
        if 'musica' in category or 'música' in category:
            cleaned_channels.append(ch)
            seen_urls.add(url)
            continue

        # Skip broken patterns
        if '[not 24/7]' in name or '[geo-blocked]' in name or '[offline]' in name:
            continue
        
        # Skip duplicates
        if url in seen_urls:
            continue

        # Skip specific unstable ports/ips if not music
        if ':1935' in url or '45.184.109.10' in url:
            continue

        cleaned_channels.append(ch)
        seen_urls.add(url)

    data['channels'] = cleaned_channels
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Cleaned {original_count - len(cleaned_channels)} channels. Total remaining: {len(cleaned_channels)}")

if __name__ == "__main__":
    clean_channels()
