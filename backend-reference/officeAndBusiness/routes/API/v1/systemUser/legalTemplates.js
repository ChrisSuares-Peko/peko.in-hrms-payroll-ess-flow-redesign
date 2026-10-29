const express = require('express');
const {
    findAllTemplates,
    createTemplate,
    updateTemplate,
    toggleTemplateStatus,
    deleteTemplate,
    exportTemplates,
} = require('../../../../controllers/admin/legalTemplates');

const router = express.Router({ mergeParams: true });

router.get('/', findAllTemplates);
router.get('/export/:type', exportTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.patch('/:id/toggle-status', toggleTemplateStatus);
router.delete('/:id', deleteTemplate);

module.exports = router;
