/**
 * Implementation for CatalogService defined in ./cat-service.cds
 */
import cds = require('@sap/cds');

export const serviceHandler = srv => {
  // Use reflection to get the csn definition of Books
  const { Books } = cds.entities;

  // Add some discount for overstocked books
  srv.after('READ', 'Books', books => {
    books.forEach(book => {
      if (book.stock > 111) {
        book.title += ' -- 11% discount!';
      }
    });
  });

  // // Reduce stock of books upon incoming orders
  // srv.before ('CREATE', 'Orders', async (req) => {
  //   const tx = cds.transaction(req), order = req.data;
  //   if (order.Items) {
  //     const affectedRows = await tx.run(order.Items.map(item =>
  //       UPDATE(Books).where({ID: item.book_ID})
  //         .and(`stock >=`, item.amount)
  //         .set(`stock -=`, item.amount),
  //       ),
  //     );
  //     if (affectedRows.some(row => !row)) { req.error(409, 'Sold out, sorry'); }
  //   }
  // });
};
