import pptxgen from 'pptxgenjs';
import * as FileSystem from 'expo-file-system';

const RED = 'CC0000';
const RED_DARK = '990000';
const DARK = '1A1A1A';
const MID = '555555';
const LIGHT_BG = 'F8F8F8';
const WHITE = 'FFFFFF';

const fetchAsBase64 = async (uri) => {
  try {
    if (uri.startsWith('data:')) return uri;
    let localUri = uri;
    if (uri.startsWith('http')) {
      localUri = `${FileSystem.cacheDirectory}ppt_${Date.now()}.jpg`;
      const dl = await FileSystem.downloadAsync(uri, localUri);
      localUri = dl.uri;
    }
    const b64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${b64}`;
  } catch (e) {
    console.warn('Image fetch failed:', e.message);
    return null;
  }
};

const formatDate = (ts) => {
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date();
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const generatePPT = async (project, photos) => {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE'; // 10" × 5.625"
  prs.author = 'WecapuRRed';
  prs.subject = `${project.name} - Client Presentation`;
  prs.title = project.name;

  // ── Title Slide ──────────────────────────────────────────
  const title = prs.addSlide();
  title.background = { color: RED };

  // Top decorative strip
  title.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: RED_DARK },
    line: { color: RED_DARK },
  });

  // Bottom decorative strip
  title.addShape(prs.ShapeType.rect, {
    x: 0, y: 5.5, w: '100%', h: 0.125,
    fill: { color: RED_DARK },
    line: { color: RED_DARK },
  });

  // Left accent block
  title.addShape(prs.ShapeType.rect, {
    x: 0, y: 0.12, w: 0.18, h: 5.38,
    fill: { color: RED_DARK },
    line: { color: RED_DARK },
  });

  // Company name
  title.addText('WecapuRRed', {
    x: 0.5, y: 0.9, w: 9, h: 1,
    color: WHITE, fontSize: 52, bold: true, align: 'center', fontFace: 'Arial',
  });

  // Tagline
  title.addText('Banner & Hoarding Solutions', {
    x: 0.5, y: 2.0, w: 9, h: 0.45,
    color: 'FFBBBB', fontSize: 18, align: 'center', fontFace: 'Arial',
  });

  // Divider
  title.addShape(prs.ShapeType.rect, {
    x: 3.5, y: 2.6, w: 3, h: 0.03,
    fill: { color: WHITE },
    line: { color: WHITE },
  });

  // Project name
  title.addText(project.name, {
    x: 0.5, y: 2.8, w: 9, h: 0.65,
    color: WHITE, fontSize: 28, bold: true, align: 'center', fontFace: 'Arial',
  });

  // Client
  title.addText(`Prepared for: ${project.clientName}`, {
    x: 0.5, y: 3.55, w: 9, h: 0.4,
    color: 'FFDDDD', fontSize: 15, align: 'center', fontFace: 'Arial',
  });

  // Description
  if (project.description) {
    title.addText(project.description, {
      x: 1.5, y: 4.05, w: 7, h: 0.45,
      color: 'FFCCCC', fontSize: 11, align: 'center', italic: true,
    });
  }

  // Date
  title.addText(formatDate(project.createdAt), {
    x: 0.5, y: 5.1, w: 9, h: 0.28,
    color: 'FFBBBB', fontSize: 10, align: 'center',
  });

  // ── Photo Slides ─────────────────────────────────────────
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const slide = prs.addSlide();
    slide.background = { color: WHITE };

    // Header bar
    slide.addShape(prs.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.45,
      fill: { color: RED },
      line: { color: RED },
    });

    // Header: project name
    slide.addText(project.name, {
      x: 0.2, y: 0.08, w: 7.5, h: 0.3,
      color: WHITE, fontSize: 11, bold: true, fontFace: 'Arial',
    });

    // Header: slide counter
    slide.addText(`${i + 1} / ${photos.length}`, {
      x: 8.2, y: 0.08, w: 1.6, h: 0.3,
      color: WHITE, fontSize: 10, align: 'right',
    });

    // Image area (left)
    const imgData = await fetchAsBase64(photo.imageUrl);
    if (imgData) {
      slide.addImage({
        data: imgData,
        x: 0.2, y: 0.6, w: 5.6, h: 4.55,
        sizing: { type: 'contain', w: 5.6, h: 4.55 },
      });
    } else {
      // Placeholder if image fails
      slide.addShape(prs.ShapeType.rect, {
        x: 0.2, y: 0.6, w: 5.6, h: 4.55,
        fill: { color: 'F0F0F0' },
        line: { color: 'CCCCCC', width: 1 },
      });
      slide.addText('Image unavailable', {
        x: 0.2, y: 2.6, w: 5.6, h: 0.5,
        color: '999999', fontSize: 12, align: 'center',
      });
    }

    // Specs panel background (right)
    slide.addShape(prs.ShapeType.rect, {
      x: 6.05, y: 0.6, w: 3.75, h: 4.55,
      fill: { color: LIGHT_BG },
      line: { color: 'E8E8E8', width: 1 },
    });

    // Specs panel header
    slide.addShape(prs.ShapeType.rect, {
      x: 6.05, y: 0.6, w: 3.75, h: 0.38,
      fill: { color: RED_DARK },
      line: { color: RED_DARK },
    });
    slide.addText('SPECIFICATIONS', {
      x: 6.05, y: 0.65, w: 3.75, h: 0.28,
      color: WHITE, fontSize: 9, bold: true, align: 'center', fontFace: 'Arial',
    });

    let y = 1.12;

    const addSpec = (label, value) => {
      if (!value) return;
      // Label
      slide.addText(label, {
        x: 6.2, y, w: 3.45, h: 0.22,
        color: RED, fontSize: 7.5, bold: true, fontFace: 'Arial',
      });
      y += 0.22;
      // Value
      const lines = Math.ceil(value.length / 32);
      const h = Math.min(lines * 0.22, 0.55);
      slide.addText(value, {
        x: 6.2, y, w: 3.45, h,
        color: DARK, fontSize: 10, wrap: true, fontFace: 'Arial',
      });
      y += h + 0.1;
      // Divider
      slide.addShape(prs.ShapeType.rect, {
        x: 6.2, y, w: 3.3, h: 0.01,
        fill: { color: 'E0E0E0' },
        line: { color: 'E0E0E0' },
      });
      y += 0.1;
    };

    addSpec('LOCATION', photo.location);

    const dims = [
      photo.length ? `Length: ${photo.length}` : null,
      photo.breadth ? `Breadth: ${photo.breadth}` : null,
      photo.height ? `Height: ${photo.height}` : null,
    ]
      .filter(Boolean)
      .join('   ');
    addSpec('DIMENSIONS (L × B × H)', dims);

    addSpec('MATERIAL / TYPE', photo.material);
    addSpec('NOTES', photo.notes);

    // Footer bar
    slide.addShape(prs.ShapeType.rect, {
      x: 0, y: 5.33, w: '100%', h: 0.3,
      fill: { color: DARK },
      line: { color: DARK },
    });
    slide.addText('WecapuRRed  |  Banner & Hoarding Solutions', {
      x: 0.2, y: 5.36, w: 9.6, h: 0.22,
      color: WHITE, fontSize: 7.5, align: 'center',
    });
  }

  // ── Thank You Slide ───────────────────────────────────────
  const outro = prs.addSlide();
  outro.background = { color: RED };

  outro.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: RED_DARK },
    line: { color: RED_DARK },
  });
  outro.addShape(prs.ShapeType.rect, {
    x: 0, y: 5.5, w: '100%', h: 0.125,
    fill: { color: RED_DARK },
    line: { color: RED_DARK },
  });

  outro.addText('Thank You', {
    x: 0.5, y: 1.5, w: 9, h: 0.9,
    color: WHITE, fontSize: 52, bold: true, align: 'center',
  });
  outro.addText('for choosing WecapuRRed', {
    x: 0.5, y: 2.5, w: 9, h: 0.45,
    color: 'FFBBBB', fontSize: 18, align: 'center',
  });

  outro.addShape(prs.ShapeType.rect, {
    x: 3.5, y: 3.1, w: 3, h: 0.03,
    fill: { color: WHITE },
    line: { color: WHITE },
  });

  outro.addText(`Project: ${project.name}`, {
    x: 0.5, y: 3.25, w: 9, h: 0.38,
    color: 'FFDDDD', fontSize: 14, align: 'center',
  });
  outro.addText(`Client: ${project.clientName}`, {
    x: 0.5, y: 3.7, w: 9, h: 0.35,
    color: 'FFDDDD', fontSize: 13, align: 'center',
  });
  outro.addText(`Total Sites: ${photos.length}`, {
    x: 0.5, y: 4.1, w: 9, h: 0.3,
    color: 'FFCCCC', fontSize: 12, align: 'center',
  });

  // ── Save file ─────────────────────────────────────────────
  const base64 = await prs.write({ outputType: 'base64' });
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `${FileSystem.documentDirectory}${safeName}_Presentation.pptx`;

  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return filePath;
};
