import {
 Html, Head, Body, Container, Heading, Text,
 Section, Row, Column, Hr, Button
} from '@react-email/components';
export function OrderConfirmation({ customerName, orderItems, total, orderId }) {
 return (
 <Html>
 <Head />
 <Body style={{ fontFamily: 'Arial, sans-serif', background: '#f8fafc' }}>
 <Container style={{ maxWidth: '600px', margin: '40px auto', background:
'#fff', borderRadius: '8px', padding: '40px' }}>
 <Heading style={{ color: '#1B3A5C', fontSize: '24px' }}>
 Order Confirmed!
 </Heading>
 <Text>Hi {customerName}, your order #{orderId} has been
confirmed.</Text>
 <Hr />
 {orderItems.map((item, i) => (
 <Row key={i}>
 <Column>{item.name} x{item.quantity}</Column>
 <Column style={{ textAlign: 'right'
}}>${item.price.toFixed(2)}</Column>
 </Row>
 ))}
 <Hr />
 <Text style={{ fontWeight: 'bold', fontSize: '18px' }}>Total:
${total.toFixed(2)}</Text>
 <Button href='https://yourstore.com/orders' style={{ background:
'#2563EB', color: '#fff', padding: '12px 24px', borderRadius: '6px' }}>
 View Order
 </Button>
 </Container>
 </Body>
 </Html>
 );
}