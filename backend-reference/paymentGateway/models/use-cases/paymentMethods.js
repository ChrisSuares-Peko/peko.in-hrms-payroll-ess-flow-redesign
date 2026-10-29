const { customLog } = require("../../utils/loggerHelper");
const PaymentMethods = require("../entities/paymentMethods");
const PaymentMethodServices = require("../entities/paymentMethodServices");
const ServiceOperator = require("../entities/serviceOperator");
const { Sequelize, Op } = require("sequelize");
const sequelize = require('./../../configs/database/index');
const { GATEWAY_PROVIDERS, SUPPORTED_GATEWAY_PROVIDERS } = require("../../constants/gatewayProviders");

const PAYMENT_GATEWAY_METHOD = "PAYMENT_GATEWAY";

const resolvePgProvider = (paymentMethod, pgProvider) => {
    if (paymentMethod !== PAYMENT_GATEWAY_METHOD) return { value: null };
    return SUPPORTED_GATEWAY_PROVIDERS.includes(pgProvider)
        ? { value: pgProvider }
        : { error: "Please select a valid payment gateway." };
};

exports.createPaymentMethod = async ({ partnerId, paymentMethod, services, limitPerTransaction, limitPerDay, limitPerMonth, pgProvider }) => {
    const resolvedPgProvider = resolvePgProvider(paymentMethod, pgProvider);
    if (resolvedPgProvider.error) return { status: false, message: resolvedPgProvider.error };

    let transaction = await sequelize.transaction();

    try {
        const existingMethod = await PaymentMethods.findOne({ where: { partnerId, paymentMethod, pgProvider: resolvedPgProvider.value } });
        if (existingMethod) return { status: false, message: "This payment method is already added for the partner." };
        const limits = {
            limitPerTransaction: limitPerTransaction ?? 0,
            limitPerDay: limitPerDay ?? 0,
            limitPerMonth: limitPerMonth ?? 0,
          };

        const newPaymentMethod = await PaymentMethods.create({ partnerId, paymentMethod, limits, pgProvider: resolvedPgProvider.value }, { transaction });
        const rawPaymentMethod = newPaymentMethod.get({ plain: true }); // Extracts raw values

        if (services && services.length > 0) {
            const serviceEntries = services.map(service => ({ paymentMethodId: rawPaymentMethod.id, serviceOperatorId: service, isAvailable: true }));
            await PaymentMethodServices.bulkCreate(serviceEntries, { transaction });
        }
        await transaction.commit();
        return { status: true, message: "Payment method created successfully.", data: rawPaymentMethod };
    } catch (error) {
        await transaction.rollback();
        customLog(null, "error", { message: error.message, error: error })
        return { status: false, message: "Something went wrong while creating the payment method." };
    }
};

exports.editPaymentMethod = async (paymentMethodId, { services, partnerId, paymentMethod, limits, pgProvider }) => {
    const resolvedPgProvider = resolvePgProvider(paymentMethod, pgProvider);
    if (resolvedPgProvider.error) return { status: false, message: resolvedPgProvider.error };

    let transaction = await sequelize.transaction();

    try {
        const isExist = await PaymentMethods.findByPk(paymentMethodId);
        if (!isExist) return { status: false, message: "Payment method not found." };

        const existingMethod = await PaymentMethods.findOne({ where: { partnerId, paymentMethod, pgProvider: resolvedPgProvider.value } });
        if (existingMethod && existingMethod.id != paymentMethodId) return { status: false, message: "This payment method is already added for the partner." };
        limits = {
            limitPerTransaction: limits?.limitPerTransaction ?? 0,
            limitPerDay: limits?.limitPerDay ?? 0,
            limitPerMonth: limits?.limitPerMonth ?? 0,
          };
        await PaymentMethods.update({
            partnerId,
            paymentMethod,
            limits,
            pgProvider: resolvedPgProvider.value,
        }, {
            where: {
                id: paymentMethodId,
            },
            transaction
        });

        const serviceIds = services.map(Number);

        const existingServices = await PaymentMethodServices.findAll({ where: { paymentMethodId } });
        const existingServiceIds = existingServices.map(service => service.serviceOperatorId);

        // Set isAvailable = true for all services in the `services` array
        await PaymentMethodServices.update(
            { isAvailable: true },
            {
                where: {
                    paymentMethodId,
                    serviceOperatorId: serviceIds
                },
                transaction
            }
        );

        // Set isAvailable = false for services not in the `services` array
        await PaymentMethodServices.update(
            { isAvailable: false },
            {
                where: {
                    paymentMethodId,
                    serviceOperatorId: { [Op.notIn]: serviceIds }
                },
                transaction
            }
        );
        // Identify new services to add
        const newServices = serviceIds.filter(serviceId => !existingServiceIds.includes(serviceId));
        if (newServices.length > 0) {
            const serviceEntries = newServices.map(service => ({ paymentMethodId, serviceOperatorId: service, isAvailable: true }));
            await PaymentMethodServices.bulkCreate(serviceEntries, { transaction });
        }

        await transaction.commit();

        return { status: true, message: "Payment method updated successfully." };
    } catch (error) {
        await transaction.rollback();
        customLog(null, "error", { message: error.message, error: error })
        return { status: false, message: "Something went wrong while updating the payment method." };
    }
};

exports.updatePaymentMethodStatus = async (paymentMethodId, isActive) => {
    try {
        const paymentMethod = await PaymentMethods.findByPk(paymentMethodId);
        if (!paymentMethod) return { status: false, message: "Payment method not found." };

        await PaymentMethods.update({ isActive }, { where: { id: paymentMethodId } });

        return {
            status: true,
            message: isActive ? "Payment method enabled successfully." : "Payment method disabled successfully.",
            data: { id: paymentMethod.id, isActive },
        };
    } catch (error) {
        customLog(null, "error", { message: error.message, error: error })
        return { status: false, message: "Something went wrong while updating the payment method status." };
    }
};

exports.getAllPaymentMethods = async ({ searchText, page,itemsPerPage,sort,sortField, partnerId, pgProvider, isActive, paymentMethod }) => {
    try {
      page = page ? parseInt(page) : 1;
      itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
      const limit = itemsPerPage;
      const offset = (page - 1) * itemsPerPage;
  
      const allowedSortFields = ["createdAt", "paymentMethod", "id", "name"];
  
      const safeSortField = allowedSortFields.includes(sortField)
        ? sortField
        : "createdAt";
  
      const safeSort = sort && sort.toUpperCase() === "ASC" ? "ASC" : "DESC";
  
      const orderClause =
        safeSortField === "name"
          ? `c.name ${safeSort}`
          : `pm.\`${safeSortField}\` ${safeSort}`;
  
      let partnerClause = "";
      if (partnerId === "default") {
        partnerClause = "AND pm.partnerId IS NULL";
      } else if (partnerId) {
        partnerClause = "AND pm.partnerId = :partnerId";
      }

      const pgProviderClause = pgProvider ? "AND pm.pgProvider = :pgProvider" : "";
      const hasStatusFilter = typeof isActive === "boolean";
      const statusClause = hasStatusFilter ? "AND pm.isActive = :isActive" : "";
      const paymentMethodClause = paymentMethod ? "AND pm.paymentMethod = :paymentMethod" : "";

      const replacements = {
        searchText: searchText || null,
        partnerId,
        pgProvider: pgProvider || null,
        isActive: hasStatusFilter ? isActive : null,
        paymentMethod: paymentMethod || null,
        paymentGatewayMethod: PAYMENT_GATEWAY_METHOD,
        limit,
        offset,
      };

      const query = `
        SELECT
          pm.*,
          GROUP_CONCAT(pms.serviceOperatorId) AS serviceList,
          c.name,
          EXISTS (
            SELECT 1 FROM payment_methods other
            WHERE other.id <> pm.id
              AND other.paymentMethod = :paymentGatewayMethod
              AND other.isActive = TRUE
              AND other.partnerId <=> pm.partnerId
          ) AS hasOtherActiveGateway
        FROM payment_methods pm
        LEFT JOIN credentials c ON pm.partnerId = c.id
        LEFT JOIN payment_methods_services pms 
          ON pm.id = pms.paymentMethodId 
          AND pms.isAvailable = TRUE
        WHERE 
          (:searchText IS NULL OR 
            pm.paymentMethod LIKE CONCAT('%', :searchText, '%') OR 
            c.name LIKE CONCAT('%', :searchText, '%'))
          ${partnerClause}
          ${pgProviderClause}
          ${statusClause}
          ${paymentMethodClause}
        GROUP BY pm.id, c.id
        ORDER BY ${orderClause}
        LIMIT :limit OFFSET :offset;
      `;
  
      const rows = await sequelize.query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });
  
      const countQuery = `
        SELECT COUNT(DISTINCT pm.id) AS count
        FROM payment_methods pm
        LEFT JOIN credentials c ON pm.partnerId = c.id
        LEFT JOIN payment_methods_services pms 
          ON pm.id = pms.paymentMethodId 
          AND pms.isAvailable = TRUE
        WHERE 
          (:searchText IS NULL OR 
            pm.paymentMethod LIKE CONCAT('%', :searchText, '%') OR 
            c.name LIKE CONCAT('%', :searchText, '%'))
          ${partnerClause}
          ${pgProviderClause}
          ${statusClause}
          ${paymentMethodClause}
      `;
  
      const result = await sequelize.query(countQuery, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });
  
      const count = Number(result[0]?.count || 0);
  
      const formattedData = rows.map(pm => ({
        id: pm.id,
        partnerId: pm.partnerId,
        name: pm.name,
        paymentMethod: pm.paymentMethod,
        pgProvider: pm.pgProvider ?? null,
        pgProviderName: GATEWAY_PROVIDERS.find(({ pgProvider }) => pgProvider === pm.pgProvider)?.name ?? null,
        isActive: Boolean(pm.isActive),
        hasOtherActiveGateway: Boolean(pm.hasOtherActiveGateway),
        limits: pm.limits,
        createdAt: pm.createdAt,
        updatedAt: pm.updatedAt,
        serviceList: pm.serviceList
          ? pm.serviceList.split(",").map(Number)
          : [],
      }));
  
      return {
        status: true,
        message: "Payment methods fetched successfully.",
        recordsTotal: count,
        recordsFiltered: count,
        data: formattedData,
      };
    } catch (error) {
      customLog(null, "error", { message: error.message, error });
      return {
        status: false,
        message: "Something went wrong while fetching payment methods.",
      };
    }
  };


exports.findAllPaymentMethodForCorporate = async ({ partnerId, accessKey }) => {
    try {
        const isPaymentMethodAvailable = await PaymentMethods.findAll({
            include: [
                {
                    model: PaymentMethodServices,
                    as: "serviceList",
                    required: false,
                    where: { isAvailable: true },
                    include: {
                        model: ServiceOperator,
                        attributes: ['accessKey'],
                        required: true,
                    }
                },
            ],
            distinct: true,
            where: { partnerId: partnerId, isActive: true, "$serviceList.serviceOperator.accessKey$": accessKey, },
            raw: true,
            nest: true
        });

        return isPaymentMethodAvailable
    } catch (error) {
        customLog(null, "error", { message: error.message, error: error })
        return false
    }
};