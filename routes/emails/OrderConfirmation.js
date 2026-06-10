const React = require('react');
const { Html, Head, Body, Container, Heading, Text, Row, Column, Hr, Button } = require('@react-email/components');

function OrderConfirmation({ customerName, orderItems, total, orderId }) {
  return React.createElement(
    Html, null,
    React.createElement(Head, null),
    React.createElement(
      Body, { style: { fontFamily: 'Arial, sans-serif', background: '#f8fafc' } },
      React.createElement(
        Container, { style: { maxWidth: '600px', margin: '40px auto', background: '#fff', borderRadius: '8px', padding: '40px' } },
        React.createElement(Heading, { style: { color: '#1B3A5C', fontSize: '24px' } }, 'Order Confirmed!'),
        React.createElement(Text, null, `Hi ${customerName}, your order #${orderId} has been confirmed.`),
        React.createElement(Hr, null),
        orderItems.map((item, i) =>
          React.createElement(
            Row, { key: i },
            React.createElement(Column, null, `${item.name} x${item.quantity}`),
            React.createElement(Column, { style: { textAlign: 'right' } }, `$${item.price.toFixed(2)}`)
          )
        ),
        React.createElement(Hr, null),
        React.createElement(Text, { style: { fontWeight: 'bold', fontSize: '18px' } }, `Total: $${total.toFixed(2)}`),
        React.createElement(
          Button, { href: 'https://yourstore.com/orders', style: { background: '#2563EB', color: '#fff', padding: '12px 24px', borderRadius: '6px' } },
          'View Order'
        )
      )
    )
  );
}

module.exports = { OrderConfirmation };
