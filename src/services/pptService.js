import pptxgen from 'pptxgenjs';
import * as FileSystem from 'expo-file-system';

const GREEN      = '2D6A4F';
const GREEN_DARK = '1B4332';
const DARK       = '1B3A2A';
const LIGHT_BG   = 'F5EDD6';
const WHITE      = 'FFFFFF';
const BORDER     = 'DDD3B0';
const TINT       = 'D8F3E6';

const fetchAsBase64 = async (uri) => {
  try {
    if (uri.startsWith('data:')) return uri;
    const localUri = `${FileSystem.cacheDirectory}ppt_${Date.now()}.jpg`;
    const dl = await FileSystem.downloadAsync(uri, localUri);
    const b64 = await FileSystem.readAsStringAsync(dl.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${b64}`;
  } catch (e) {
    console.warn('Image fetch failed:', e.message);
    return null;
  }
};

const formatDate = (ts) => {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const generatePPT = async (project, photos) => {
  // Group flat photo rows by image_url → one slide per unique image
  const groupMap = new Map();
  photos.forEach((p) => {
    if (!groupMap.has(p.image_url)) groupMap.set(p.image_url, []);
    groupMap.get(p.image_url).push(p);
  });
  const groups = [...groupMap.values()];

  const prs = new pptxgen();
  prs.layout  = 'LAYOUT_WIDE';
  prs.author  = 'Norrvex Partner';
  prs.subject = `${project.name} - Client Presentation`;
  prs.title   = project.name;

  // ── Title Slide ───────────────────────────────────────────
  const title = prs.addSlide();
  title.background = { color: GREEN };
  title.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.12, fill:{color:GREEN_DARK}, line:{color:GREEN_DARK} });
  title.addShape(prs.ShapeType.rect, { x:0, y:5.5, w:'100%', h:0.125, fill:{color:GREEN_DARK}, line:{color:GREEN_DARK} });
  title.addShape(prs.ShapeType.rect, { x:0, y:0.12, w:0.18, h:5.38, fill:{color:GREEN_DARK}, line:{color:GREEN_DARK} });

  title.addText('Norrvex Partner', { x:0.5, y:0.9, w:9, h:1, color:WHITE, fontSize:52, bold:true, align:'center' });
  title.addText('Banner & Hoarding Solutions', { x:0.5, y:2.0, w:9, h:0.45, color:TINT, fontSize:18, align:'center' });
  title.addShape(prs.ShapeType.rect, { x:3.5, y:2.6, w:3, h:0.03, fill:{color:WHITE}, line:{color:WHITE} });
  title.addText(project.name, { x:0.5, y:2.8, w:9, h:0.65, color:WHITE, fontSize:28, bold:true, align:'center' });
  title.addText(`Prepared for: ${project.client_name}`, { x:0.5, y:3.55, w:9, h:0.4, color:TINT, fontSize:15, align:'center' });
  if (project.description) {
    title.addText(project.description, { x:1.5, y:4.05, w:7, h:0.45, color:TINT, fontSize:11, align:'center', italic:true });
  }
  title.addText(formatDate(project.created_at), { x:0.5, y:5.1, w:9, h:0.28, color:TINT, fontSize:10, align:'center' });

  // ── Photo Slides (one per unique image) ───────────────────
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const first = group[0];
    const slide = prs.addSlide();
    slide.background = { color: WHITE };

    slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.45, fill:{color:GREEN}, line:{color:GREEN} });
    slide.addText(project.name, { x:0.2, y:0.08, w:7.5, h:0.3, color:WHITE, fontSize:11, bold:true });
    slide.addText(`${i+1} / ${groups.length}`, { x:8.2, y:0.08, w:1.6, h:0.3, color:WHITE, fontSize:10, align:'right' });

    const imgData = await fetchAsBase64(first.image_url);
    if (imgData) {
      slide.addImage({ data:imgData, x:0.2, y:0.6, w:5.6, h:4.55, sizing:{type:'contain',w:5.6,h:4.55} });
    } else {
      slide.addShape(prs.ShapeType.rect, { x:0.2, y:0.6, w:5.6, h:4.55, fill:{color:'F0F0F0'}, line:{color:BORDER,width:1} });
      slide.addText('Image unavailable', { x:0.2, y:2.6, w:5.6, h:0.5, color:'999999', fontSize:12, align:'center' });
    }

    // Specs panel
    slide.addShape(prs.ShapeType.rect, { x:6.05, y:0.6, w:3.75, h:4.55, fill:{color:LIGHT_BG}, line:{color:BORDER,width:1} });
    slide.addShape(prs.ShapeType.rect, { x:6.05, y:0.6, w:3.75, h:0.38, fill:{color:GREEN_DARK}, line:{color:GREEN_DARK} });
    slide.addText('SPECIFICATIONS', { x:6.05, y:0.65, w:3.75, h:0.28, color:WHITE, fontSize:9, bold:true, align:'center' });

    let y = 1.12;
    const addSpec = (label, value) => {
      if (!value || y > 4.8) return;
      slide.addText(label, { x:6.2, y, w:3.45, h:0.2, color:GREEN, fontSize:7, bold:true });
      y += 0.2;
      const h = Math.min(Math.ceil(value.length / 34) * 0.2, 0.5);
      slide.addText(value, { x:6.2, y, w:3.45, h, color:DARK, fontSize:9.5, wrap:true });
      y += h + 0.1;
      slide.addShape(prs.ShapeType.rect, { x:6.2, y, w:3.3, h:0.01, fill:{color:BORDER}, line:{color:BORDER} });
      y += 0.06;
    };

    // Location shown once (shared)
    addSpec('LOCATION', first.location);

    // Per-entry specs
    group.forEach((photo, idx) => {
      if (y > 4.8) return;
      if (group.length > 1) {
        if (idx > 0) {
          slide.addShape(prs.ShapeType.rect, { x:6.15, y: y + 0.02, w:3.35, h:0.01, fill:{color:BORDER}, line:{color:BORDER} });
          y += 0.16;
        }
        slide.addText(`ENTRY ${idx + 1}`, { x:6.2, y, w:3.45, h:0.18, color:GREEN_DARK, fontSize:6.5, bold:true });
        y += 0.18;
      }
      const dims = [
        photo.length  ? `L: ${photo.length}`  : null,
        photo.breadth ? `B: ${photo.breadth}` : null,
        photo.height  ? `H: ${photo.height}`  : null,
      ].filter(Boolean).join('   ');
      addSpec('MATERIAL / TYPE', photo.material);
      addSpec('DIMENSIONS', dims);
      addSpec('NOTES', photo.notes);
    });

    slide.addShape(prs.ShapeType.rect, { x:0, y:5.33, w:'100%', h:0.3, fill:{color:DARK}, line:{color:DARK} });
    slide.addText('Norrvex Partner  |  Banner & Hoarding Solutions', { x:0.2, y:5.36, w:9.6, h:0.22, color:WHITE, fontSize:7.5, align:'center' });
  }

  // ── Thank You Slide ───────────────────────────────────────
  const outro = prs.addSlide();
  outro.background = { color: GREEN };
  outro.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.12, fill:{color:GREEN_DARK}, line:{color:GREEN_DARK} });
  outro.addShape(prs.ShapeType.rect, { x:0, y:5.5, w:'100%', h:0.125, fill:{color:GREEN_DARK}, line:{color:GREEN_DARK} });
  outro.addText('Thank You', { x:0.5, y:1.5, w:9, h:0.9, color:WHITE, fontSize:52, bold:true, align:'center' });
  outro.addText('for choosing Norrvex Partner', { x:0.5, y:2.5, w:9, h:0.45, color:TINT, fontSize:18, align:'center' });
  outro.addShape(prs.ShapeType.rect, { x:3.5, y:3.1, w:3, h:0.03, fill:{color:WHITE}, line:{color:WHITE} });
  outro.addText(`Project: ${project.name}`, { x:0.5, y:3.25, w:9, h:0.38, color:TINT, fontSize:14, align:'center' });
  outro.addText(`Client: ${project.client_name}`, { x:0.5, y:3.7, w:9, h:0.35, color:TINT, fontSize:13, align:'center' });
  outro.addText(`Total Sites: ${groups.length}`, { x:0.5, y:4.1, w:9, h:0.3, color:TINT, fontSize:12, align:'center' });

  // ── Save ──────────────────────────────────────────────────
  const base64   = await prs.write({ outputType: 'base64' });
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `${FileSystem.documentDirectory}${safeName}_Presentation.pptx`;
  await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
  return filePath;
};
