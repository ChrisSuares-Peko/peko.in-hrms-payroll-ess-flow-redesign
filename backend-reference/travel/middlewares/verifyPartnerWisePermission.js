// middlewares/verify partner wise corporate User

const verifyUserPermission = (services, label) => {
    // Helper function to search in both main services and sub-services
    const searchService = (serviceList, targetLabel) => {
        for (let service of serviceList) {
            if (service.label === targetLabel) {
                return service.hasAccess;
            }
            if (service.subServices && service.subServices.length > 0) {
                const subServiceAccess = searchService(service.subServices, targetLabel);
                if (subServiceAccess !== false) {
                    return subServiceAccess;
                }
            }
        }
        //if label not exist then return false
        return false;
    };

    return searchService(services, label);
};

module.exports = { verifyUserPermission };
