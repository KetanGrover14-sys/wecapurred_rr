import pptxgen from 'pptxgenjs';

const RED      = 'CC0000';
const RED_DARK = '990000';
const WHITE    = 'FFFFFF';
const DARK     = '1A1A1A';
const LIGHT_BG = 'F8F8F8';

const toBase64 = async (url) => {
  const res  = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  const json = await res.json();
  if (!json.data) throw new Error('Image proxy returned no data');
  return json.data;
};

const fmt = (ts) => {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const generatePPT = async (project, photos) => {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';
  prs.author = 'WecapuRRed';
  prs.title  = project.name;

  // ── Title slide ──────────────────────────────────────────
  const title = prs.addSlide();
  title.background = { color: RED };
  title.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.12, fill:{color:RED_DARK}, line:{color:RED_DARK} });
  title.addShape(prs.ShapeType.rect, { x:0, y:5.5, w:'100%', h:0.13, fill:{color:RED_DARK}, line:{color:RED_DARK} });

  title.addText('WecapuRRed', {
    x:0.5, y:0.9, w:9, h:1, color:WHITE, fontSize:52, bold:true, align:'center',
  });
  title.addText('Banner & Hoarding Solutions', {
    x:0.5, y:2.0, w:9, h:0.45, color:'FFBBBB', fontSize:18, align:'center',
  });
  title.addShape(prs.ShapeType.rect, { x:3.5, y:2.6, w:3, h:0.03, fill:{color:WHITE}, line:{color:WHITE} });
  title.addText(project.name, {
    x:0.5, y:2.8, w:9, h:0.65, color:WHITE, fontSize:28, bold:true, align:'center',
  });
  title.addText(`Prepared for: ${project.client_name}`, {
    x:0.5, y:3.55, w:9, h:0.4, color:'FFDDDD', fontSize:15, align:'center',
  });
  if (project.description) {
    title.addText(project.description, {
      x:1.5, y:4.05, w:7, h:0.45, color:'FFCCCC', fontSize:11, align:'center', italic:true,
    });
  }
  title.addText(fmt(project.created_at), {
    x:0.5, y:5.1, w:9, h:0.28, color:'FFBBBB', fontSize:10, align:'center',
  });

  // ── Group flat rows by image_url → one slide per unique image ──
  const groupMap = new Map();
  photos.forEach((p) => {
    if (!groupMap.has(p.image_url)) groupMap.set(p.image_url, []);
    groupMap.get(p.image_url).push(p);
  });
  const groups = [...groupMap.values()];

  // ── Photo slides ─────────────────────────────────────────
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const first = group[0];
    const slide = prs.addSlide();
    slide.background = { color: WHITE };

    slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.45, fill:{color:RED}, line:{color:RED} });
    slide.addText(project.name, { x:0.2, y:0.08, w:7.5, h:0.3, color:WHITE, fontSize:11, bold:true });
    slide.addText(`${i+1} / ${groups.length}`, { x:8.2, y:0.08, w:1.6, h:0.3, color:WHITE, fontSize:10, align:'right' });

    try {
      const imgData = await toBase64(first.image_url);
      slide.addImage({ data:imgData, x:0.2, y:0.6, w:5.6, h:4.55, sizing:{type:'contain',w:5.6,h:4.55} });
    } catch (_) {}

    // Specs panel background
    slide.addShape(prs.ShapeType.rect, { x:6.05, y:0.6, w:3.75, h:4.55, fill:{color:LIGHT_BG}, line:{color:'E8E8E8',width:1} });
    slide.addShape(prs.ShapeType.rect, { x:6.05, y:0.6, w:3.75, h:0.38, fill:{color:RED_DARK}, line:{color:RED_DARK} });
    slide.addText('SPECIFICATIONS', { x:6.05, y:0.65, w:3.75, h:0.28, color:WHITE, fontSize:9, bold:true, align:'center' });

    let y = 1.12;
    const addSpec = (label, value) => {
      if (!value || y > 4.8) return;
      slide.addText(label, { x:6.2, y, w:3.45, h:0.2, color:RED, fontSize:7, bold:true });
      y += 0.2;
      const h = Math.min(Math.ceil(value.length / 34) * 0.2, 0.5);
      slide.addText(value, { x:6.2, y, w:3.45, h, color:DARK, fontSize:9.5, wrap:true });
      y += h + 0.1;
    };

    // Location is shared — show once
    addSpec('LOCATION', first.location);

    // Per-entry specs
    group.forEach((photo, idx) => {
      if (y > 4.8) return;
      if (group.length > 1) {
        // Entry divider
        if (idx > 0) {
          slide.addShape(prs.ShapeType.rect, { x:6.15, y: y + 0.02, w:3.35, h:0.01, fill:{color:'DDDDDD'}, line:{color:'DDDDDD'} });
          y += 0.18;
        }
        slide.addText(`ENTRY ${idx + 1}`, { x:6.2, y, w:3.45, h:0.18, color:RED_DARK, fontSize:6.5, bold:true });
        y += 0.18;
      }
      const dims = [photo.length&&`L: ${photo.length}`, photo.breadth&&`B: ${photo.breadth}`, photo.height&&`H: ${photo.height}`].filter(Boolean).join('   ');
      addSpec('MATERIAL / TYPE', photo.material);
      addSpec('DIMENSIONS', dims);
      addSpec('NOTES', photo.notes);
    });

    slide.addShape(prs.ShapeType.rect, { x:0, y:5.33, w:'100%', h:0.3, fill:{color:DARK}, line:{color:DARK} });
    slide.addText('WecapuRRed  |  Banner & Hoarding Solutions', { x:0.2, y:5.36, w:9.6, h:0.22, color:WHITE, fontSize:7.5, align:'center' });
  }

  // ── Thank You slide ───────────────────────────────────────
  const outro = prs.addSlide();
  outro.background = { color: RED };
  outro.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.12, fill:{color:RED_DARK}, line:{color:RED_DARK} });
  outro.addText('Thank You', { x:0.5, y:1.5, w:9, h:0.9, color:WHITE, fontSize:52, bold:true, align:'center' });
  outro.addText('for choosing WecapuRRed', { x:0.5, y:2.5, w:9, h:0.45, color:'FFBBBB', fontSize:18, align:'center' });
  outro.addShape(prs.ShapeType.rect, { x:3.5, y:3.1, w:3, h:0.03, fill:{color:WHITE}, line:{color:WHITE} });
  outro.addText(`Project: ${project.name}  |  Client: ${project.client_name}`, { x:0.5, y:3.3, w:9, h:0.38, color:'FFDDDD', fontSize:14, align:'center' });
  outro.addText(`Total Sites: ${groups.length}`, { x:0.5, y:3.75, w:9, h:0.3, color:'FFCCCC', fontSize:12, align:'center' });

  // ── Download ──────────────────────────────────────────────
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
  await prs.writeFile({ fileName: `${safeName}_Presentation.pptx` });
};
