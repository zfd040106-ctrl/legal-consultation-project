from PIL import Image, ImageDraw

size = (81, 81)

def create_icon(name, color):
    img = Image.new('RGBA', size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    if name == 'home':
        # 绘制房子形状
        # 屋顶（三角形）
        draw.polygon([(20, 50), (40.5, 25), (61, 50)], outline=color, fill=color, width=3)
        # 房身（矩形）
        draw.rectangle([20, 50, 61, 65], outline=color, width=3)
        # 门
        draw.rectangle([35, 57, 46, 65], outline=color, width=2)
        
    elif name == 'notification':
        # 绘制铃铛
        # 钟身
        draw.ellipse([22, 20, 59, 50], outline=color, fill=color, width=3)
        # 钟柄
        draw.rectangle([38, 12, 43, 20], outline=color, fill=color, width=2)
        # 摇铃
        draw.ellipse([28, 50, 37, 60], outline=color, fill=color, width=2)
        draw.ellipse([44, 50, 53, 60], outline=color, fill=color, width=2)
        
    elif name == 'user':
        # 绘制用户头像
        # 头部（圆形）
        draw.ellipse([25, 15, 56, 40], outline=color, fill=color, width=3)
        # 身体（半圆形）
        draw.arc([18, 40, 63, 70], 0, 180, color, width=4)
        draw.chord([18, 40, 63, 70], 0, 180, fill=color)
    
    return img

# 创建所有图标
icons = {
    'home': '#999999',           # 未选中颜色
    'notification': '#999999',
    'user': '#999999',
}

icons_active = {
    'home': '#007AFF',           # 选中颜色
    'notification': '#007AFF',
    'user': '#007AFF',
}

icon_dir = r"C:\Users\14265.000\Desktop\law-consult-bs\law\law-consult-miniprogram\assets\icons"

for icon_name, color in icons.items():
    img = create_icon(icon_name, color)
    img.save(f"{icon_dir}\{icon_name}-inactive.png")
    print(f'✓ Created {icon_name}-inactive.png')

for icon_name, color in icons_active.items():
    img = create_icon(icon_name, color)
    img.save(f"{icon_dir}\{icon_name}-active.png")
    print(f'✓ Created {icon_name}-active.png')

print('\n✓ All icons created successfully!')
