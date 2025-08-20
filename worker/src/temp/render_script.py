
import bpy

# Set render engine to EEVEE (faster and more compatible than Cycles)
bpy.context.scene.render.engine = 'BLENDER_EEVEE'

# Disable denoising
if hasattr(bpy.context.scene.eevee, 'use_taa_reprojection'):
    bpy.context.scene.eevee.use_taa_reprojection = False

# Basic render settings
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.resolution_percentage = 50  # Render at 50% for speed

# Set output format
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.filepath = '/home/rico/cairo/VeriFrame/worker/src/temp/render.png'

# Render the scene
bpy.ops.render.render(write_still=True)
