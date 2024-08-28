// controllers/RefundController.js

const Product = require('../models/Product');
const Refund = require('../models/Refund');
const SaleProduct = require('../models/sales/SaleProduct');
const Invoice = require('../models/sales/Invoice');

class RefundController {
  static index = async (req, res) => {
    return res.json(await Invoice.findById(req.params.id));
  }

  static create = async (req, res) => {
    const refundData = req.body;
    const invoice = await Invoice.findById(refundData.invoiceId);
    if ( !refundData.refundOperations.length )
      return res.status(422).json(`L'avoir que vous venez d'effectuer est vide`);
    /** Run the check for inventories */
    // boucle hna
    const createRefund = {
      invoiceId: invoice.id,
      refundOperations: []
    };
    for (const refundOperation of refundData.refundOperations) {
      const saleProduct = await SaleProduct.findById(refundOperation.saleProductId);
      /** had lcode wlahila 3ad ktbto hadii 5 hours o nssit kifach mohim kayjiib refunded quantity li deja f db */
      const refundedQuantity = invoice.refunds.map(
        refund => refund.refundOperations.filter(
          ro => ro.saleProductId == refundOperation.saleProductId
        ).reduce( (acc, ro2) => acc + ro2.quantity, 0)
      )[0] ?? 0;
      const restQuantity = saleProduct.quantity - refundedQuantity;
      // nchofo wach kayna quantity kamla b3da sinon rah kayn mochkil f stock and it has to be fixed asap
      if ( restQuantity >= refundOperation.quantity ) {
        // boucle hna
        for (const [index, operation] of saleProduct.InventoryOperations.entries()) {
          operation.refundedQuantity = saleProduct.refundOperations.filter(ro => ro.saleProductId == saleProduct.id).reduce(
            (acc, ro) => acc + ro.quantity, 0
          );
          operation.restQuantity = operation.quantity - operation.refundedQuantity;
          if ( operation.restQuantity >= refundOperation.quantity ) {
            refundOperation.inventoryId = operation.inventoryId;
            const createRefund = await Refund.createRefund(refundData);
            return res.json(createRefund);
          } else {
            if ( saleProduct.InventoryOperations[index + 1] ) {
              createRefund.refundOperations.push({
                quantity: operation.restQuantity,
                saleProductId: saleProduct.id,
                inventoryId: operation.inventoryId
              });
              refundOperation.quantity -= operation.restQuantity;
            } else {
              createRefund.refundOperations.push({
                quantity: refundOperation.quantity,
                saleProductId: saleProduct.id,
                inventoryId: operation.inventoryId
              });
            }
          }
        }
      }
    }
    return res.json(await Refund.createRefund(createRefund));
  }

  static createFromInvoice = async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    const createRefund = {
      invoiceId: invoice.id,
      refundOperations: []
    };
    /** Get every single sale product in this Invoice */
    var saleProducts = [].concat(...invoice.deliveryForms.map(df => df.sale.saleProducts));
    saleProducts = saleProducts.map(sp => {
      return {
        ...sp,
        quantityRefunded: sp.refundOperations.reduce((acc, refundOperation) => acc + refundOperation.quantity, 0)
      }
    });

    for (const saleProduct of saleProducts) {
      const quantityToRefund = saleProduct.quantity - saleProduct.quantityRefunded;
      if( quantityToRefund > 0 ) {
        for (const inventoryOperation of saleProduct.InventoryOperations) {
          const refunds = saleProduct.refundOperations.filter(operation => operation.inventoryId == inventoryOperation.inventoryId);
          const refundedQuantity = refunds.reduce((acc, refundOperation) => acc + refundOperation.quantity, 0);
          if ( inventoryOperation.quantity > refundedQuantity )
            createRefund.refundOperations.push({
              quantity: inventoryOperation.quantity - refundedQuantity,
              saleProductId: saleProduct.id,
              inventoryId: inventoryOperation.inventoryId
            });
          // console.log(inventoryOperation.quantity, refundedQuantity);
          // console.log(saleProduct.quantity, saleProduct.id);
          // console.log("------------");
        }
      } 
    }

    // return res.json(await Refund.createRefund(createRefund));
    return res.status(422).json(createRefund);
  }
}

module.exports = RefundController