export function renderBlocksToHtml(blocks) {
  const body = blocks.map(block => {
    const { type, content, style } = block;

    if (type === 'divider') {
      return `<tr><td style="padding:8px 32px;"><hr style="border:none;border-top:1px solid ${style?.color || '#e5e7eb'};" /></td></tr>`;
    }
    if (type === 'image') {
      return `<tr><td style="padding:12px 32px;text-align:${style?.textAlign || 'center'};"><img src="${content}" alt="" style="max-width:100%;border-radius:8px;" /></td></tr>`;
    }
    if (type === 'button') {
      return `<tr><td style="padding:16px 32px;text-align:${style?.textAlign || 'center'};"><a href="${block.url || '#'}" style="display:inline-block;background-color:${style?.backgroundColor || '#f97316'};color:${style?.color || '#ffffff'};padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none;">${content}</a></td></tr>`;
    }
    if (type === 'heading') {
      return `<tr><td style="padding:20px 32px 8px;"><h1 style="margin:0;font-size:${style?.fontSize || '24px'};color:${style?.color || '#1a1a1a'};text-align:${style?.textAlign || 'left'};font-family:Arial,sans-serif;font-weight:700;">${content}</h1></td></tr>`;
    }
    // text
    const lines = (content || '').split('\n').map(l => `<p style="margin:0 0 8px 0;">${l || '&nbsp;'}</p>`).join('');
    return `<tr><td style="padding:8px 32px;font-size:${style?.fontSize || '15px'};color:${style?.color || '#444444'};text-align:${style?.textAlign || 'left'};font-family:Arial,sans-serif;line-height:1.7;">${lines}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:40px 20px;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tbody>
      ${body}
      <tr><td style="height:32px;"></td></tr>
    </tbody>
  </table>
</body>
</html>`;
}