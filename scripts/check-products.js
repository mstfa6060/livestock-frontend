// Quick script to check if products exist in the database
const axios = require('axios');

const API_URL = 'https://dev-api.livestock-trading.com';

async function checkProducts() {
  try {
    const response = await axios.post(`${API_URL}/livestocktrading/Products/All`, {
      countryCode: 'TR',
      sorting: { key: 'createdAt', direction: 1 },
      filters: [],
      pageRequest: {
        currentPage: 1,
        perPageCount: 10,
        listAll: false
      }
    });

    console.log(`\n✅ Found ${response.data.length} products in the database\n`);

    if (response.data.length > 0) {
      console.log('First 5 products:');
      response.data.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.title} - ${p.basePrice} ${p.currency}`);
      });
    } else {
      console.log('❌ No products found. You need to create some products first.');
      console.log('\nGo to: http://localhost:3000/dashboard/listings/new');
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkProducts();
