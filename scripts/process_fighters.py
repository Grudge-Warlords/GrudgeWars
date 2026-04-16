from PIL import Image
import os
import shutil

FIGHTERS = {
    'raze': {
        'source': 'street-boss-brawler',
        'native_size': 96,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack4.png', None),
            'hook': ('Attack1.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Special.png', None),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Special.png', None),
            'win': ('Idle.png', None),
        }
    },
    'volt': {
        'source': 'street-boss-pyro',
        'native_size': 96,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack4.png', None),
            'hook': ('Attack2.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Fire_attack.png', (0, 6)),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Special.png', None),
            'win': ('Idle.png', None),
        }
    },
    'venom': {
        'source': 'street-boss-bomber',
        'native_size': 96,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack4.png', None),
            'hook': ('Attack1.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Attack4.png', None),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Special.png', None),
            'win': ('Idle.png', None),
        }
    },
    'wraith': {
        'source': 'lab-boss-cyborg',
        'native_size': 72,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack4.png', None),
            'hook': ('Attack2.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Attack4.png', None),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Special.png', None),
            'win': ('Idle.png', None),
        }
    },
    'blitz': {
        'source': 'lab-boss-mutant',
        'native_size': 72,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack4.png', None),
            'hook': ('Attack1.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Attack4.png', None),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Special.png', None),
            'win': ('Idle.png', None),
        }
    },
    'shade': {
        'source': 'lab-boss-mech',
        'native_size': 72,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack1.png', None),
            'hook': ('Attack2.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Attack1.png', None),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Special.png', None),
            'win': ('Idle.png', None),
        }
    },
    'ghost': {
        'source': 'spirit_boxer',
        'native_size': 44,
        'anim_map': {
            'idle': ('idle.png', (0, 6)),
            'walk': ('walk.png', (0, 6)),
            'jab': ('attack1.png', (0, 6)),
            'cross': ('attack2.png', (0, 6)),
            'kick': ('attack3.png', (0, 6)),
            'uppercut': ('attack1.png', (6, 6)),
            'hook': ('attack2.png', (6, 6)),
            'lowkick': ('attack3.png', (6, 6)),
            'highkick': ('attack2.png', (12, 6)),
            'block': ('idle.png', (0, 1)),
            'guard': ('idle.png', (0, 2)),
            'hurt': ('hurt.png', (0, 6)),
            'stun': ('hurt.png', (0, 6)),
            'ko': ('death.png', (0, 6)),
            'special': ('attack3.png', (12, 6)),
            'win': ('idle.png', (0, 6)),
        }
    },
    'surge': {
        'source': 'gang-shooter',
        'native_size': 48,
        'anim_map': {
            'idle': ('Idle.png', None),
            'walk': ('Walk.png', None),
            'jab': ('Attack1.png', None),
            'cross': ('Attack2.png', None),
            'kick': ('Attack3.png', None),
            'uppercut': ('Attack1.png', None),
            'hook': ('Attack2.png', None),
            'lowkick': ('Attack3.png', None),
            'highkick': ('Attack3.png', None),
            'block': ('Idle.png', (0, 1)),
            'guard': ('Idle.png', (0, 2)),
            'hurt': ('Hurt.png', None),
            'stun': ('Hurt.png', None),
            'ko': ('Death.png', None),
            'special': ('Attack3.png', None),
            'win': ('Idle.png', None),
        }
    },
}

TARGET_SIZE = 96
SRC_BASE = 'public/sprites'
DST_BASE = 'public/sprites/grudge-box/fighters'

def process_strip(src_path, native_size, target_size, frame_slice=None):
    img = Image.open(src_path).convert('RGBA')
    w, h = img.size
    fw = native_size
    fh = native_size
    total_frames = w // fw

    if frame_slice:
        start, count = frame_slice
        count = min(count, total_frames - start)
        frames_to_use = range(start, start + count)
    else:
        frames_to_use = range(total_frames)

    num_frames = len(list(frames_to_use))
    frames_to_use = list(frames_to_use)

    if native_size == target_size:
        out = Image.new('RGBA', (num_frames * target_size, target_size), (0, 0, 0, 0))
        for i, fi in enumerate(frames_to_use):
            frame = img.crop((fi * fw, 0, (fi + 1) * fw, fh))
            out.paste(frame, (i * target_size, 0))
        return out, num_frames
    else:
        scale = target_size / native_size
        out = Image.new('RGBA', (num_frames * target_size, target_size), (0, 0, 0, 0))
        for i, fi in enumerate(frames_to_use):
            frame = img.crop((fi * fw, 0, (fi + 1) * fw, fh))
            scaled = frame.resize((target_size, target_size), Image.NEAREST)
            out.paste(scaled, (i * target_size, 0))
        return out, num_frames


def process_all():
    for fighter_id, config in FIGHTERS.items():
        src_dir = os.path.join(SRC_BASE, config['source'])
        dst_dir = os.path.join(DST_BASE, fighter_id)

        os.makedirs(dst_dir, exist_ok=True)

        print(f"\n=== Processing {fighter_id} (from {config['source']}, {config['native_size']}px → {TARGET_SIZE}px) ===")

        processed = set()
        for anim_name, (src_file, frame_slice) in config['anim_map'].items():
            src_path = os.path.join(src_dir, src_file)
            dst_path = os.path.join(dst_dir, f'{anim_name}.png')

            cache_key = (src_file, str(frame_slice))
            if cache_key in processed and os.path.exists(dst_path):
                continue

            if not os.path.exists(src_path):
                print(f"  WARNING: {src_path} not found, skipping {anim_name}")
                continue

            try:
                result_img, num_frames = process_strip(
                    src_path,
                    config['native_size'],
                    TARGET_SIZE,
                    frame_slice
                )
                result_img.save(dst_path, 'PNG')
                print(f"  {anim_name}.png: {num_frames} frames ({result_img.size[0]}x{result_img.size[1]})")
                processed.add(cache_key)
            except Exception as e:
                print(f"  ERROR processing {anim_name}: {e}")

    print("\n=== Done! ===")
    for fighter_id in FIGHTERS:
        dst_dir = os.path.join(DST_BASE, fighter_id)
        files = sorted(os.listdir(dst_dir))
        print(f"{fighter_id}: {len(files)} files - {', '.join(files)}")


if __name__ == '__main__':
    process_all()
