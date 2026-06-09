import TemplateClassic   from './templates/TemplateClassic';
import TemplateWave      from './templates/TemplateWave';
import TemplateMinimal   from './templates/TemplateMinimal';
import TemplateGeometric from './templates/TemplateGeometric';
import TemplateCorporate from './templates/TemplateCorporate';
import TemplateMono      from './templates/TemplateMono';

export default function InvoiceDocument({ biz, invoice, forPdf = false, template = 'classic' }) {
  const props = { biz, invoice, forPdf };
  switch (template) {
    case 'wave':      return <TemplateWave      {...props} />;
    case 'minimal':   return <TemplateMinimal   {...props} />;
    case 'geometric': return <TemplateGeometric {...props} />;
    case 'corporate': return <TemplateCorporate {...props} />;
    case 'mono':      return <TemplateMono      {...props} />;
    default:          return <TemplateClassic   {...props} />;
  }
}
