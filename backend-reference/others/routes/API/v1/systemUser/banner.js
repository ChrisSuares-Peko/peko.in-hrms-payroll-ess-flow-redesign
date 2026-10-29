const express = require('express')
const { findAllBanners, deleteBanner, createBanner, updateBanner, bannersPDF, bannersExcelCSV } = require('../../../../controllers/admin/banners')
const { validateBanner, validateBannerStatus } = require('../../../../utils/apiValidation');
const { validateBannerListQuery } = require('../../../../utils/queryValidation');

const router = express.Router()

router.get('/', validateBannerListQuery, findAllBanners);
router.get('/pdf',validateBannerListQuery, bannersPDF)//✅
router.get('/:type',validateBannerListQuery, bannersExcelCSV)//✅
router.post('/', validateBanner, createBanner)//✅
router.put('/:id', validateBanner, updateBanner)//✅
router.put('/updateStatus/:id', validateBannerStatus, updateBanner)//✅
router.delete('/:id', deleteBanner)//✅

module.exports = router
