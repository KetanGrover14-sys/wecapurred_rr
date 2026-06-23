import pptxgen from 'pptxgenjs';
import { getProjectById, getPhotosByProject } from '../../../../../lib/sheets';
import { withAuth } from '../../../../../lib/withAuth';

const RED      = 'CC0000';
const RED_DARK = '990000';
const WHITE    = 'FFFFFF';
const DARK     = '1A1A1A';
const LIGHT_BG = 'F8F8F8';

const fmt = (ts) => {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fetchImageAsBase64 = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    const ct  = res.headers.get('content-type') || 'image/jpeg';
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
};

export const GET = withAuth(async (request, { params }) => {
  const { role, id: userId } = request.user;
  const [project, photos] = await Promise.all([
    getProjectById(params.id),
    getPhotosByProject(params.id),
  ]);

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
  if (role !== 'admin' && project.vendor_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const prs = new pptxgen();
  prs.layout = 'LAYOUT_16x9';
  prs.author = 'Norrvex Partner';
  prs.title  = project.name;

  // Title slide
  const title = prs.addSlide();
  title.background = { color: RED };
  title.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.12, fill:{color:RED_DARK}, line:{color:RED_DARK} });
  title.addShape(prs.ShapeType.rect, { x:0, y:5.5, w:'100%', h:0.13, fill:{color:RED_DARK}, line:{color:RED_DARK} });
  title.addText('Norrvex Partner', { x:0.5, y:0.9, w:9, h:1, color:WHITE, fontSize:52, bold:true, align:'center' });
  title.addText('Banner & Hoarding Solutions', { x:0.5, y:2.0, w:9, h:0.45, color:'FFBBBB', fontSize:18, align:'center' });
  title.addShape(prs.ShapeType.rect, { x:3.5, y:2.6, w:3, h:0.03, fill:{color:WHITE}, line:{color:WHITE} });
  title.addText(project.name, { x:0.5, y:2.8, w:9, h:0.65, color:WHITE, fontSize:28, bold:true, align:'center' });
  title.addText(`Prepared for: ${project.client_name}`, { x:0.5, y:3.55, w:9, h:0.4, color:'FFDDDD', fontSize:15, align:'center' });
  if (project.description) {
    title.addText(project.description, { x:1.5, y:4.05, w:7, h:0.45, color:'FFCCCC', fontSize:11, align:'center', italic:true });
  }
  title.addText(fmt(project.created_at), { x:0.5, y:5.1, w:9, h:0.28, color:'FFBBBB', fontSize:10, align:'center' });

  // Group flat rows by image_url
  const groupMap = new Map();
  photos.forEach((p) => {
    if (!groupMap.has(p.image_url)) groupMap.set(p.image_url, []);
    groupMap.get(p.image_url).push(p);
  });
  const groups = [...groupMap.values()];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const first = group[0];
    const slide = prs.addSlide();
    slide.background = { color: WHITE };

    slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.45, fill:{color:RED}, line:{color:RED} });
    slide.addText(project.name, { x:0.2, y:0.08, w:7.5, h:0.3, color:WHITE, fontSize:11, bold:true });
    slide.addText(`${i+1} / ${groups.length}`, { x:8.2, y:0.08, w:1.6, h:0.3, color:WHITE, fontSize:10, align:'right' });

    // Image — full slide width
    const imgData = await fetchImageAsBase64(first.image_url);
    if (imgData) {
      slide.addImage({ data:imgData, x:0.15, y:0.48, w:4.7, h:3.72, sizing:{type:'contain',w:4.7,h:3.72} });
    }

    // ── Specs strip at the bottom ─────────────────────────
    const SY = 4.24;
    const SH = 1.06;   // SY + SH = 5.30, footer at 5.33
    const LH = 0.25;
    const CY = SY + LH;
    const CH = SH - LH;

    slide.addShape(prs.ShapeType.rect, { x:0, y:SY, w:'100%', h:SH, fill:{color:LIGHT_BG}, line:{color:'E0E0E0',width:0.5} });
    slide.addShape(prs.ShapeType.rect, { x:0, y:SY, w:'100%', h:LH, fill:{color:RED_DARK}, line:{color:RED_DARK} });
    slide.addText('SPECIFICATIONS', { x:0.2, y:SY+0.04, w:9.6, h:LH-0.06, color:WHITE, fontSize:8, bold:true, align:'center' });

    const numEntries = group.length;

    // Helper: render location + store info in left column
    const addStoreCol = (cx, w) => {
      const storeLine = first.store_name || '';
      const ownerLine = [first.store_owner_name, first.store_owner_mobile].filter(Boolean).join('  •  ');
      slide.addText('LOCATION / STORE', { x:cx, y:CY+0.06, w, h:0.18, color:RED, fontSize:7, bold:true });
      slide.addText(first.location||'—', { x:cx, y:CY+0.26, w, h:0.18, color:first.location?DARK:'AAAAAA', fontSize:8.5, wrap:true });
      if (storeLine) slide.addText(storeLine, { x:cx, y:CY+0.46, w, h:0.17, color:DARK, fontSize:8, wrap:true });
      if (ownerLine) slide.addText(ownerLine, { x:cx, y:CY+0.64, w, h:0.16, color:DARK, fontSize:7.5, wrap:true });
    };

    if (numEntries === 1) {
      const photo  = group[0];
      const dims   = [photo.length&&`L: ${photo.length}`, photo.breadth&&`B: ${photo.breadth}`, photo.height&&`H: ${photo.height}`].filter(Boolean).join('  ');
      const LEFT_W = 3.0;
      const COL_W  = (9.6 - LEFT_W) / 3;

      addStoreCol(0.2, LEFT_W - 0.1);

      [
        { label:'MATERIAL/TYPE', val: photo.material },
        { label:'DIMENSIONS',    val: dims           },
        { label:'NOTES',         val: photo.notes    },
      ].forEach(({ label, val }, ci) => {
        const cx = 0.2 + LEFT_W + ci * COL_W;
        slide.addShape(prs.ShapeType.rect, { x:cx-0.04, y:CY+0.08, w:0.02, h:CH-0.16, fill:{color:'CCCCCC'}, line:{color:'CCCCCC'} });
        slide.addText(label, { x:cx, y:CY+0.08, w:COL_W-0.1, h:0.18, color:RED, fontSize:7, bold:true });
        slide.addText(val||'—', { x:cx, y:CY+0.28, w:COL_W-0.1, h:CH-0.34, color:val?DARK:'AAAAAA', fontSize:9, wrap:true });
      });
    } else {
      const LOC_W  = 2.6;
      const entryW = (9.6 - LOC_W) / numEntries;

      addStoreCol(0.2, LOC_W - 0.1);
      slide.addShape(prs.ShapeType.rect, { x:0.2+LOC_W, y:CY+0.08, w:0.02, h:CH-0.16, fill:{color:'CCCCCC'}, line:{color:'CCCCCC'} });

      group.forEach((photo, idx) => {
        const cx   = 0.2 + LOC_W + 0.06 + idx * entryW;
        const w    = entryW - 0.1;
        const dims = [photo.length&&`L:${photo.length}`, photo.breadth&&`B:${photo.breadth}`, photo.height&&`H:${photo.height}`].filter(Boolean).join('  ');
        const body = [photo.material, dims, photo.notes].filter(Boolean).join('  •  ');
        if (idx > 0) slide.addShape(prs.ShapeType.rect, { x:cx-0.06, y:CY+0.08, w:0.02, h:CH-0.16, fill:{color:'CCCCCC'}, line:{color:'CCCCCC'} });
        slide.addText(`ENTRY ${idx+1}`, { x:cx, y:CY+0.06, w, h:0.18, color:RED_DARK, fontSize:6.5, bold:true });
        slide.addText(body||'—', { x:cx, y:CY+0.26, w, h:CH-0.32, color:body?DARK:'AAAAAA', fontSize:9, wrap:true });
      });
    }

    slide.addShape(prs.ShapeType.rect, { x:0, y:5.33, w:'100%', h:0.3, fill:{color:DARK}, line:{color:DARK} });
    slide.addText('Norrvex Partner  |  Banner & Hoarding Solutions', { x:0.2, y:5.36, w:9.6, h:0.22, color:WHITE, fontSize:7.5, align:'center' });
  }

  // Thank You slide
  const outro = prs.addSlide();
  outro.background = { color: RED };
  outro.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.12, fill:{color:RED_DARK}, line:{color:RED_DARK} });
  outro.addText('Thank You', { x:0.5, y:1.5, w:9, h:0.9, color:WHITE, fontSize:52, bold:true, align:'center' });
  outro.addText('for choosing Norrvex Partner', { x:0.5, y:2.5, w:9, h:0.45, color:'FFBBBB', fontSize:18, align:'center' });
  outro.addShape(prs.ShapeType.rect, { x:3.5, y:3.1, w:3, h:0.03, fill:{color:WHITE}, line:{color:WHITE} });
  outro.addText(`Project: ${project.name}  |  Client: ${project.client_name}`, { x:0.5, y:3.3, w:9, h:0.38, color:'FFDDDD', fontSize:14, align:'center' });
  outro.addText(`Total Sites: ${groups.length}`, { x:0.5, y:3.75, w:9, h:0.3, color:'FFCCCC', fontSize:12, align:'center' });

  const buffer = await prs.write({ outputType: 'nodebuffer' });
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${safeName}_Presentation.pptx`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
});
