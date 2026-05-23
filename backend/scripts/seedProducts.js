/**
 * Seed 18 products per category with product-specific images.
 * Run: node scripts/seedProducts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

const ITEMS_PER_CATEGORY = 18;

// Each entry: { name, image } — image must depict the listed product
const CATEGORIES = {
  Electronics: [
    { name: 'Wireless Noise-Cancelling Headphones', image: 'https://thf.bing.com/th/id/OIP._wUwheyqBjW6zUDahh7C8gHaJO?w=153&h=190&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Minimalist Smartwatch', image: 'https://thf.bing.com/th/id/OIP.c-lPJXS9xNlQlaC1TNBc-wHaFl?w=199&h=180&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Portable Bluetooth Speaker', image: 'https://thf.bing.com/th/id/OIP.q5hHbxCYwgRNWTr3nPMjzQHaHa?w=181&h=181&c=7&r=0&o=7&cb=thfc1falcon&pid=1.7&rm=3' },
    { name: 'USB-C Fast Charger 65W', image: 'https://thf.bing.com/th/id/OIP.juoXz9LK21N87m1RH5i9igHaHa?w=200&h=200&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Mechanical Gaming Keyboard', image: 'https://thf.bing.com/th/id/OIP.Ha4mLJFpTATOcPxyEkXdXAHaHa?w=192&h=150&c=6&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Wireless Ergonomic Mouse', image: 'https://thf.bing.com/th/id/OIP.67b0c-E921_aytmMtcN3QwHaHa?w=169&h=180&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: '4K Webcam with Mic', image: 'https://thf.bing.com/th/id/OIP.NLRJk10EKJq-01v4-r5TQAHaHa?w=188&h=188&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Tablet Stand with Hub', image: 'https://thf.bing.com/th/id/OIP.NDNx8JlfIjst2J6r08cWyAHaHd?w=205&h=207&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Smart LED Desk Lamp', image: 'https://thf.bing.com/th/id/OIP.yEJPundev2cNXjS_dXGZhgHaIJ?w=178&h=196&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Power Bank 20000mAh', image: 'https://thf.bing.com/th/id/OIP.dxrrJG_nkOpl2XcCCkhXpgHaJJ?w=153&h=191&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
  ],
  Fashion: [
    { name: 'Organic Cotton Crew T-Shirt', image: 'https://thf.bing.com/th/id/OIP.f7ObnOncw6Nl_VWUhWr2fAHaJR?w=202&h=253&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Slim Fit Denim Jeans', image: 'https://thf.bing.com/th/id/OIP.cq62PXS5WPvuEFLUG7dgHwHaJo?w=202&h=263&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Linen Summer Shirt', image: 'https://thf.bing.com/th/id/OIP.uRZ3Apdt9g4Q-wUgarxpsQHaHa?w=213&h=213&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Running Sneakers', image: 'https://thf.bing.com/th/id/OIP.4ZEnVWVQbLvSE-DI0mFzNQHaE8?w=223&h=180&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Leather Belt Classic', image: 'https://thf.bing.com/th/id/OIP.aGXZEo7tpOTNOFfQNE3htAHaHa?w=187&h=186&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Wool Blend Sweater', image: 'https://thf.bing.com/th/id/OIP.H3YdsnE2gtQJZOL68P8Y0QHaKT?w=202&h=281&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Casual Canvas Sneakers', image: 'https://thf.bing.com/th/id/OIP.N7gBcWDqzOfuxvCFl3LqUwHaHa?w=201&h=201&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Formal Oxford Shoes', image: 'https://thf.bing.com/th/id/OIP.S8yXO35rHIYIKM9-jbRc_gHaJ4?w=151&h=201&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Athletic Joggers', image: 'https://thf.bing.com/th/id/OIP.UJosNZYNLgdwr3ocHfOX0AHaHa?w=202&h=202&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Floral Print Kurta', image: 'https://thf.bing.com/th/id/OIP._WcNRyprxY1o52-Ys75nDgHaJ4?w=202&h=269&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
  ],
  'Home & Living': [
    { name: 'Ceramic Coffee Mug Set', image: 'https://thf.bing.com/th/id/OIP.vUT5pWbwqGsHUE2s1qCOAgHaG-?w=217&h=204&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Memory Foam Pillow', image: 'https://thf.bing.com/th/id/OIP.44fFdq5BrGdGntGAh9SJuQHaHa?w=191&h=191&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Cotton Bedsheet Set', image: 'https://thf.bing.com/th/id/OIP.jA9Cc0T85ABjRP6RviSYlgHaHa?w=197&h=197&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Scented Soy Candle', image: 'https://thf.bing.com/th/id/OIP.QY5K6P_K7PptPzgB_31GXwHaHa?w=186&h=186&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Wall Clock Minimal', image: 'https://thf.bing.com/th/id/OIP.s3P-3jClGE2A18WWrDcpfgHaHa?w=168&h=180&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Storage Basket Set', image: 'https://thf.bing.com/th/id/OIP.jxCCfYNOXo1_Bl1TIID75gHaHa?w=197&h=197&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Non-Stick Cookware Set', image: 'https://thf.bing.com/th/id/OIP.Scm74hOL2Ljz8GoMBMv50AHaFd?w=285&h=209&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Throw Blanket Soft Fleece', image: 'https://thf.bing.com/th/id/OIP.IxkuwXbBXCFHc10rQ55lbgHaHa?w=202&h=202&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Desk Organizer Tray', image: 'https://thf.bing.com/th/id/OIP.NOmHCOpVFlwyMzHadwXVDAHaHa?w=187&h=191&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Indoor Plant Pot Ceramic', image: 'https://thf.bing.com/th/id/OIP.6QTwgncf8-K7lSG8wDwbwQHaHa?w=204&h=204&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
  ],
  Beauty: [
    { name: 'Matte Liquid Lipstick', image: 'https://thf.bing.com/th/id/OIP.za_zbSSVUXwCYtQwsR5pxQHaHa?w=210&h=210&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Hydrating Face Serum', image: 'https://thf.bing.com/th/id/OIP.qaM9vEjSP7PGZR1_qj2dSwHaHa?w=195&h=195&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Vitamin C Brightening Cream', image: 'https://thf.bing.com/th/id/OIP.4xmyUsUHFMwdH83PPkCLDgHaHa?w=185&h=186&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Mascara Volume Boost', image: 'https://thf.bing.com/th/id/OIP.YxgSYr5F6xTxdN2L-hrUrwHaHa?w=207&h=208&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Sunscreen SPF 50', image: 'https://thf.bing.com/th/id/OIP.zdpyd87HPcwKlPEskr0zTQHaHa?w=194&h=194&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Gentle Face Cleanser', image: 'https://thf.bing.com/th/id/OIP.xI0yXwzalVYVp5uhjkRqNAHaHa?w=181&h=182&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Hair Repair Mask', image: 'https://thf.bing.com/th/id/OIP.4F6WtwTfSlFOcaWREVdmbgHaHa?w=134&h=180&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Nail Polish Trio', image: 'https://thf.bing.com/th/id/OIP.CMxQ6CRFsd66-diQPFkDHAHaIG?w=195&h=213&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Compact Powder Foundation', image: 'https://thf.bing.com/th/id/OIP.FJN4HwltSVbyoz60ox4aAwHaHa?w=187&h=187&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Eyebrow Definer Pencil', image: 'https://thf.bing.com/th/id/OIP.FgMcj3_emybM-4EO2M3OSgHaIq?w=182&h=213&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
  ],
  Sports: [
    { name: 'Yoga Mat 6mm Anti-Slip', image: 'https://thf.bing.com/th/id/OIP.tpMY-RAblcqDeBrs3KT9kwHaHa?w=185&h=185&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Adjustable Dumbbells Pair', image: 'https://thf.bing.com/th/id/OIP.I2eF4jjTvNO4_hZzxn8ZMQHaHa?w=203&h=203&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Resistance Bands Set', image: 'https://thf.bing.com/th/id/OIP.fU3LVMu3nijoN1ArawOOjAHaHj?w=200&h=203&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Sports Water Bottle 1L', image: 'https://thf.bing.com/th/id/OIP.b10-WMGmGouyI_TbdKb1rwHaHa?w=183&h=183&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Cricket Bat Kashmir Willow', image: 'https://thf.bing.com/th/id/OIP.bfefxOANcXHHWZXvkPHkVwHaHa?w=202&h=202&c=7&r=0&o=7&cb=thfc1falcon&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Football Size 5', image: 'https://tse2.mm.bing.net/th/id/OIP.J4Ys2KmoSaM0THwNvwmmIwHaFj?w=272&h=203&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Gym Gloves Padded', image: 'https://tse4.mm.bing.net/th/id/OIP.uELjHKPElDbDA5-S7PciwwHaHa?w=200&h=199&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Skipping Rope Steel Cable', image: 'https://tse2.mm.bing.net/th/id/OIP.J9jSJD7rAR_AWOIXEHNnNwHaHa?w=189&h=189&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Tennis Racket Lightweight', image: 'https://tse4.mm.bing.net/th/id/OIP.CH92RcJZ6ZBEgDDhwz5RSQHaHa?w=195&h=195&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Badminton Shuttlecock Pack', image: 'https://tse2.mm.bing.net/th/id/OIP.yvcWUEkQeopBe02J3iCgLgHaHa?w=193&h=193&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
  ],
  Toys: [
    { name: 'Building Blocks 200 Pieces', image: 'https://tse4.mm.bing.net/th/id/OIP.BSBTZzHIJlOrFA1guxLKTgHaHa?w=189&h=189&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Remote Control Racing Car', image: 'https://tse2.mm.bing.net/th/id/OIP.gtJ6A1Cmlx1YIm0BXtHTwwHaHa?w=186&h=186&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Plush Teddy Bear Large', image: 'https://tse2.mm.bing.net/th/id/OIP.wQAbWBwcdVp2r8cqeDd6swHaHa?w=197&h=197&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Board Game Family Pack', image: 'https://tse1.mm.bing.net/th/id/OIP.UfWhEEs_OSNPGsPylN6e7wHaHa?w=173&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Puzzle 500 Pieces Landscape', image: 'https://tse3.mm.bing.net/th/id/OIP.omMbNlR2H6g9BVpSyDj9oQHaHa?w=185&h=186&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Art & Craft Kit Kids', image: 'https://tse4.mm.bing.net/th/id/OIP.QDqWZ-aeHiM5u-QFkg2qJgHaGa?w=223&h=193&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Educational Alphabet Blocks', image: 'https://tse4.mm.bing.net/th/id/OIP.vjkMbztzP8RC1UURMji5TwHaFb?w=243&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Action Figure Set', image: 'https://tse3.mm.bing.net/th/id/OIP.Ytu6PQfzFGVTrJf9lbFWuQHaHa?w=121&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Soft Play Ball Set', image: 'https://tse2.mm.bing.net/th/id/OIP.ZzLl5UobJyflcfGeIoTNHAHaGM?w=223&h=186&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Science Experiment Kit', image: 'https://tse1.mm.bing.net/th/id/OIP.Pa2HQ42KVgcSHrA1PbCNDQHaH_?w=180&h=195&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
  ],
  Groceries: [
    { name: 'Basmati Rice 5kg', image: 'https://tse4.mm.bing.net/th/id/OIP.iZTxndLA8riH2FcMZ6GVtgHaHa?w=188&h=188&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Whole Wheat Flour 2kg', image: 'https://tse1.mm.bing.net/th/id/OIP.DTVXk5bxqeeLYjLzb-LnfAHaHa?w=175&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Sunflower Cooking Oil 1L', image: 'https://tse2.mm.bing.net/th/id/OIP.Zpn7KeYM1T7ueTGCc_m44QHaHa?w=196&h=200&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Organic Honey 500g', image: 'https://tse2.mm.bing.net/th/id/OIP.XnJxim7Gsen2s2jP1muBpgHaHa?w=184&h=185&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Green Tea Bags 100 Pack', image: 'https://tse1.mm.bing.net/th/id/OIP.kiET2m0OnVREop2LbYJa2AHaHa?w=181&h=182&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Instant Coffee 200g', image: 'https://tse3.mm.bing.net/th/id/OIP.Ji8juek3eph_CXUzYA3CrAHaHa?w=202&h=202&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Mixed Dry Fruits 500g', image: 'https://tse3.mm.bing.net/th/id/OIP.AOXbXNQsRwsIzDmLsbs4ygHaHa?w=198&h=197&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Tomato Ketchup 1kg', image: 'https://tse4.mm.bing.net/th/id/OIP.CS0NQIfD0_piNf0ejzlIXQHaHa?w=184&h=184&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Breakfast Cereal Corn Flakes', image: 'https://tse3.mm.bing.net/th/id/OIP.hwaNh387XbPRc-Ms9cRR3QHaHa?w=215&h=216&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Olive Oil Extra Virgin 500ml', image: 'https://tse2.mm.bing.net/th/id/OIP.pAO_89vHe30fx3L3A1dX6wHaH1?w=183&h=193&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
  ],
  Automotive: [
    { name: 'Car Phone Mount Magnetic', image: 'https://tse2.mm.bing.net/th/id/OIP.MMDiApIxt03rY48uHHjQyAHaHa?w=206&h=206&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Microfiber Cleaning Cloth Set', image: 'https://tse4.mm.bing.net/th/id/OIP.d8gUfHh2omQFG6K-2TXB1gHaHb?w=192&h=193&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Tyre Inflator Portable', image: 'https://tse2.mm.bing.net/th/id/OIP.W0tWeap8fi-tv2nwX1n9EgHaHc?w=206&h=207&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Dashboard Phone Holder', image: 'https://tse2.mm.bing.net/th/id/OIP.Jbmy3d7MYNQcCjkbb3iYSgHaHa?w=190&h=190&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Car Air Freshener Pack', image: 'https://tse1.mm.bing.net/th/id/OIP.B1t_Rp0aYDhaXaKeXKep3QHaHa?w=191&h=190&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Seat Cover Universal Set', image: 'https://tse1.mm.bing.net/th/id/OIP.iBANw2NwoJWfonwTKY3d2wHaHa?w=174&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Jump Starter Power Bank', image: 'https://tse4.mm.bing.net/th/id/OIP.7X4blJRxjMrOHb10f_Ou9wHaHa?w=201&h=201&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Windshield Sun Shade', image: 'https://tse3.mm.bing.net/th/id/OIP.xkC3GruZpdU9f2u9JKFQDAHaE8?w=273&h=182&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'Car Vacuum Cleaner Cordless', image: 'https://tse1.mm.bing.net/th/id/OIP.vwcfOFF6_NSm8kkj_YFo6QHaHa?w=202&h=202&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
    { name: 'LED Headlight Bulbs Pair', image: 'https://tse4.mm.bing.net/th/id/OIP.NJQTPWpvKRboqldNJtUYUgHaE8?w=280&h=187&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
  ],
};

const PRICE_RANGES = {
  Electronics: [499, 8999],
  Fashion: [299, 4999],
  'Home & Living': [199, 3999],
  Beauty: [149, 2499],
  Sports: [199, 5999],
  Toys: [149, 2999],
  Groceries: [49, 999],
  Automotive: [199, 4999],
};

const FASHION_SIZE_VARIANTS = [
  ['S', 'M', 'L'],
  ['M', 'L', 'XL'],
  ['S', 'M'],
  ['L', 'XL'],
  ['S', 'L'],
  ['M', 'XL'],
  ['S'],
  ['M'],
  ['L'],
  ['XL'],
  ['S', 'M', 'L', 'XL'],
  ['S', 'XL'],
  ['M', 'L'],
  ['S', 'M', 'XL'],
  ['M'],
  ['L'],
  ['S', 'L', 'XL'],
  ['M', 'L', 'XL'],
];

const FOOTWEAR_SIZES = ['8', '9', '10', '11', '12'];
const isFootwear = (name) => /sneaker|shoes|boots|oxford/i.test(name);

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomRating = () => Number((4 + Math.random() * 0.9).toFixed(1));

const getDetailedDescription = (name, category) => {
  const details = {
    // Electronics
    'Wireless Noise-Cancelling Headphones': 'Experience rich, immersive audio with these wireless noise-cancelling headphones. Featuring advanced active noise cancellation (ANC), custom high-fidelity drivers, ultra-soft memory foam earcups, and up to 40 hours of continuous battery life, they provide ultimate listening comfort and crystal-clear sound for music, podcasts, and calls.',
    'Minimalist Smartwatch': 'Stay connected in style with this sleek, minimalist smartwatch. Designed with an ultra-thin stainless steel casing and a crisp AMOLED display, it offers 24/7 heart rate monitoring, fitness tracking, sleep analysis, smart notifications, and a long-lasting battery that keeps you going for up to 7 days on a single charge.',
    'Portable Bluetooth Speaker': 'Bring your music anywhere with this compact, portable Bluetooth speaker. Engineered with dual custom drivers and passive radiators, it delivers powerful 360-degree stereo sound with deep bass. IPX7 waterproof and ruggedly built, it features up to 15 hours of playtime, making it perfect for outdoor adventures or home entertainment.',
    'USB-C Fast Charger 65W': 'Power up all your devices quickly and safely with this high-efficiency 65W USB-C fast charger. Built with state-of-the-art Gallium Nitride (GaN) technology, it delivers fast charging speeds in an incredibly compact design. Features advanced temperature control and multi-port safety protection for phones, tablets, and laptops.',
    'Mechanical Gaming Keyboard': 'Elevate your gaming and typing performance with this mechanical keyboard. Equipped with tactile and responsive mechanical switches, customizable vibrant RGB backlighting, full N-key rollover anti-ghosting, and a durable aircraft-grade aluminum top plate. Designed for comfort during marathon gaming sessions.',
    'Wireless Ergonomic Mouse': 'Work comfortably for hours with this wireless ergonomic mouse. Specially contoured to naturally fit the shape of your hand, it reduces muscle strain and promotes healthier wrist posture. Features a precision optical sensor, silent-click buttons, adjustable DPI levels, and a dual wireless connection via Bluetooth or USB receiver.',
    '4K Webcam with Mic': 'Upgrade your video calls and streaming with this professional 4K webcam. Capturing stunning, lifelike video at 30fps with automatic light correction and wide-angle view. Features dual built-in noise-reducing microphones to ensure your voice is heard clearly, making it perfect for remote work, online learning, and live streaming.',
    'Tablet Stand with Hub': 'Maximize your productivity with this premium tablet stand featuring an integrated USB-C hub. Constructed from durable, adjustable aluminum, it holds your device at the perfect viewing angle. The built-in hub includes HDMI port, USB ports, card readers, and USB-C power delivery pass-through for complete connectivity.',
    'Smart LED Desk Lamp': 'Illuminate your workspace perfectly with this smart LED desk lamp. Features customizable brightness and color temperature settings ranging from warm white to cool daylight. Equipped with a built-in wireless charging pad, a USB charging port, and auto-timer controls, it offers eye-friendly lighting to reduce eye strain.',
    'Power Bank 20000mAh': 'Never run out of power on the go with this high-capacity 20,000mAh power bank. Equipped with dual USB ports and power delivery fast charging technology, it can charge multiple devices simultaneously. Built with premium lithium polymer cells and comprehensive safety systems to protect against overcharging.',

    // Fashion
    'Organic Cotton Crew T-Shirt': 'Elevate your everyday wardrobe with this classic crewneck t-shirt. Crafted from 100% certified organic cotton, it offers exceptional softness, breathability, and durability. Designed with a modern, tailored fit and reinforced seams, it is perfect for layering or wearing on its own.',
    'Slim Fit Denim Jeans': 'Upgrade your casual style with these classic slim-fit denim jeans. Made from premium stretch denim cotton, they offer a comfortable fit that moves with you while maintaining their shape. Features classic five-pocket styling, a secure zip fly with button closure, and a versatile wash for any occasion.',
    'Linen Summer Shirt': 'Stay cool and stylish in warm weather with this lightweight linen summer shirt. Woven from high-quality, breathable flax linen blend, it features a relaxed fit, a classic button-down collar, and long sleeves that can be rolled up for a casual look. An essential piece for warm-weather dressing.',
    'Running Sneakers': 'Achieve your personal best with these high-performance running sneakers. Engineered with a breathable mesh upper, a responsive cushioned midsole for maximum shock absorption, and a durable rubber outsole for superior grip and traction. Designed to provide comfort and support step after step.',
    'Leather Belt Classic': 'Complete your formal or casual look with this classic leather belt. Handcrafted from premium full-grain genuine leather, it features a polished, scratch-resistant metal buckle and refined edge stitching. Built to last, it adds a touch of timeless sophistication to any outfit.',
    'Wool Blend Sweater': 'Keep warm and cozy in chilly weather with this premium wool blend sweater. Knitted from a soft, insulating wool blend yarn, it features a classic crew neck design, ribbed cuffs, and hem. Designed for a comfortable regular fit that pairs perfectly with trousers or jeans.',
    'Casual Canvas Sneakers': 'Enjoy effortless style and comfort with these classic casual canvas sneakers. Made with a durable cotton canvas upper, a cushioned footbed, and a vulcanized non-slip rubber sole. Perfect for everyday wear, walking, and completing your favorite casual streetwear looks.',
    'Formal Oxford Shoes': 'Step out in elegance with these classic formal Oxford shoes. Crafted from hand-polished genuine leather, they feature a sleek closed-lacing system, a cushioned leather-lined insole for all-day comfort, and a durable outsole. Ideal for weddings, business meetings, and formal events.',
    'Athletic Joggers': 'Unwind in comfort or power through your workout with these versatile athletic joggers. Made from a soft, moisture-wicking fleece fabric, they feature an adjustable drawstring waistband, zippered side pockets, and tapered cuffs. Designed for optimal mobility and casual athletic style.',
    'Floral Print Kurta': 'Celebrate tradition in style with this beautiful floral print kurta. Tailored from a soft, breathable cotton fabric, it features a classic collar neck, a comfortable straight fit, and intricate floral patterns. Perfect for festive occasions, family gatherings, or smart-casual wear.',

    // Home & Living
    'Ceramic Coffee Mug Set': 'Start your mornings right with this set of hand-glazed ceramic coffee mugs. Made from high-fired, durable stoneware, each mug features a comfortable handle and a unique, rustic glaze finish. Microwave and dishwasher safe, they are perfect for hot coffee, tea, or cocoa.',
    'Memory Foam Pillow': 'Enjoy a restful night\'s sleep with this ergonomic memory foam pillow. Designed to conform to the natural contours of your head, neck, and shoulders, it provides optimal support and alignment. Covered in a breathable, hypoallergenic, and machine-washable bamboo cover.',
    'Cotton Bedsheet Set': 'Transform your bedroom into a peaceful oasis with this premium cotton bedsheet set. Made from long-staple cotton with a soft sateen weave, it offers a luxurious feel and exceptional breathability. The set includes a flat sheet, a deep-pocket fitted sheet, and matching pillowcases.',
    'Scented Soy Candle': 'Create a relaxing atmosphere with this hand-poured scented soy candle. Made from 100% natural, eco-friendly soy wax and premium fragrance oils, it offers a clean, long-lasting burn. Housed in a reusable glass jar with a lead-free cotton wick, it fills your home with soothing aromas.',
    'Wall Clock Minimal': 'Keep track of time with this elegant, minimalist wall clock. Designed with a clean face, slim hands, and a silent sweep quartz movement, it ensures zero ticking noise. Ideal for bedrooms, offices, or living rooms, it doubles as a stylish piece of modern wall decor.',
    'Storage Basket Set': 'Organize your home beautifully with this set of woven storage baskets. Handcrafted from natural, eco-friendly cotton rope, they are soft yet sturdy. Perfect for storing blankets, toys, laundry, or books, they add a warm, organized touch to any room in the house.',
    'Non-Stick Cookware Set': 'Upgrade your kitchen with this comprehensive non-stick cookware set. Featuring heavy-duty aluminum construction for even heat distribution and a durable, PFOA-free non-stick coating for easy food release and cleanup. Includes essential pots, pans, and tempered glass lids.',
    'Throw Blanket Soft Fleece': 'Snuggle up in comfort with this ultra-soft fleece throw blanket. Made from high-density, premium microfiber fleece, it offers lightweight warmth and a luxurious velvety feel. Perfect for draping over your sofa, bed, or armchair, it is machine washable for easy care.',
    'Desk Organizer Tray': 'Clear the clutter from your workspace with this modern desk organizer tray. Crafted from premium, durable materials, it features multiple compartments to organize pens, notebooks, paperclips, and phones. Keep your essential tools within reach and boost your productivity.',
    'Indoor Plant Pot Ceramic': 'Showcase your favorite houseplants with this elegant ceramic indoor plant pot. Featuring a clean, modern design and a drainage hole with a removable plug to prevent overwatering. Built from premium high-fired ceramic, it adds a natural touch to desks or windowsills.',

    // Beauty
    'Matte Liquid Lipstick': 'Get bold, high-impact color that lasts all day with this matte liquid lipstick. Formulated with intensive pigments and nourishing ingredients, it glides on smoothly as a liquid and dries to a comfortable, non-drying matte finish. Transfer-proof and smudge-proof formula.',
    'Hydrating Face Serum': 'Rejuvenate your skin with this intensive hydrating face serum. Packed with pure hyaluronic acid, vitamins, and natural botanical extracts, it penetrates deeply to plump, smooth, and restore moisture balance. Lightweight and fast-absorbing for a glowing, youthful complexion.',
    'Vitamin C Brightening Cream': 'Brighten and even out your skin tone with this Vitamin C brightening cream. Infused with powerful antioxidants and natural extracts, it works to fade dark spots, improve skin elasticity, and protect against environmental stressors. Leaves skin feeling soft, hydrated, and radiant.',
    'Mascara Volume Boost': 'Create dramatic, full-looking lashes with this volume boost mascara. Designed with a unique brush that coats every single lash from root to tip, it adds incredible volume, length, and lift without clumping, flaking, or smudging. Ophthalmologist-tested and safe for sensitive eyes.',
    'Sunscreen SPF 50': 'Protect your skin from harmful UV rays with this broad-spectrum SPF 50 sunscreen. Formulated with a lightweight, non-greasy texture that absorbs instantly without leaving a white cast. Water-resistant and enriched with soothing antioxidants, it is perfect for daily face and body protection.',
    'Gentle Face Cleanser': 'Cleanse your skin gently and effectively with this foaming face cleanser. Specially formulated to remove dirt, makeup, and impurities without stripping away natural moisture. Enriched with chamomile and aloe vera to soothe, refresh, and balance all skin types.',
    'Hair Repair Mask': 'Restore dry, damaged hair with this intensive hair repair mask. Enriched with argan oil, keratin, and natural proteins, it deeply nourishes, hydrates, and strengthens hair fibers. Reduces frizz, repairs split ends, and leaves hair feeling incredibly soft, shiny, and manageable.',
    'Nail Polish Trio': 'Pamper your nails with this curated nail polish trio. Featuring three highly pigmented, long-wear shades with a smooth, chip-resistant formula and a glossy gel-like finish. Free from harsh chemicals, the precision brush ensures an easy, salon-quality application at home.',
    'Compact Powder Foundation': 'Achieve a flawless, natural-looking finish with this compact powder foundation. Offering buildable, medium-to-full coverage with a lightweight feel and oil-controlling properties. Perfect for setting makeup, reducing shine, and touching up your complexion on the go.',
    'Eyebrow Definer Pencil': 'Shape and fill in your brows naturally with this ultra-fine eyebrow definer pencil. Featuring a micro-fine tip on one end to create hair-like strokes and a spoolie brush on the other to blend seamlessly. Smudge-proof and long-lasting formula for perfectly defined brows.',

    // Sports
    'Yoga Mat 6mm Anti-Slip': 'Enhance your yoga and fitness practice with this premium 6mm anti-slip yoga mat. Made from eco-friendly, high-density TPE material, it offers superior cushioning and joint support. The double-sided textured surface ensures excellent grip, preventing slipping during poses.',
    'Adjustable Dumbbells Pair': 'Optimize your home workout routine with this pair of adjustable dumbbells. Featuring an easy-to-use weight adjustment system, they let you change weight increments quickly. Built with durable steel plates and textured ergonomic handles for a secure and comfortable grip.',
    'Resistance Bands Set': 'Incorporate versatile strength training into your routine with this complete set of resistance bands. Includes multiple stackable bands of varying resistance levels, comfortable foam handles, ankle straps, and a door anchor. Perfect for home workouts, physical therapy, and stretching.',
    'Sports Water Bottle 1L': 'Stay hydrated throughout your workouts with this durable 1L sports water bottle. Made from BPA-free, impact-resistant Tritan material, it features a leak-proof flip-top lid, a fast-flowing drink spout, and measurement markings. Includes a convenient carry strap.',
    'Cricket Bat Kashmir Willow': 'Play your best shots with this high-quality cricket bat crafted from premium, selected Kashmir Willow. Features a massive sweet spot, thick edges, and a dynamic cane handle for optimal shock absorption and control. Wrapped with a comfortable, high-tack rubber grip.',
    'Football Size 5': 'Experience professional-grade play with this classic size 5 football. Constructed with a durable synthetic leather casing, reinforced stitching, and a high-retention rubber bladder for consistent bounce and shape retention. Suitable for training, matches, and casual play.',
    'Gym Gloves Padded': 'Protect your hands and improve your grip with these padded gym gloves. Designed with high-density padding on the palms to prevent calluses and blisters, breathable mesh fabric on the back, and an adjustable hook-and-loop wrist strap for added support.',
    'Skipping Rope Steel Cable': 'Supercharge your cardio workouts with this high-speed steel cable skipping rope. Featuring dual-bearing handles for smooth, high-velocity rotation and an adjustable PVC-coated steel cable that can be easily customized to your height. Perfect for boxing, cross-training, and fitness.',
    'Tennis Racket Lightweight': 'Dominate the tennis court with this lightweight, high-performance tennis racket. Constructed from a durable aluminum alloy frame, it features a large sweet spot, pre-strung high-tension strings, and a comfortable, cushioned grip. Perfect for beginners and recreational players.',
    'Badminton Shuttlecock Pack': 'Ensure consistent flight performance with this premium pack of badminton shuttlecocks. Crafted with selected feathers and a durable synthetic cork base, they offer stable flight trajectories, precise control, and high durability for training and matches.',

    // Toys
    'Building Blocks 200 Pieces': 'Unleash your child\'s creativity with this vibrant 200-piece building blocks set. Made from high-quality, non-toxic, and durable plastic, these interlocking bricks are easy to connect and build. Includes a storage box to keep play areas clean and organized.',
    'Remote Control Racing Car': 'Experience high-speed thrill with this full-function remote control racing car. Equipped with an ergonomic wireless controller, it features responsive steering, working headlights, and rugged tires for indoor and outdoor play. Powered by rechargeable batteries.',
    'Plush Teddy Bear Large': 'Gift endless hugs with this large, incredibly soft plush teddy bear. Crafted from premium, hypoallergenic plush fabric and stuffed with fluffy cotton, it features friendly eyes, a stitched smile, and a classic neck ribbon. A perfect companion for kids and collectors.',
    'Board Game Family Pack': 'Bring the family together for game night with this multi-game board game family pack. Includes classic games that test strategy, memory, and wordplay, offering hours of entertainment and learning. High-quality game boards, tokens, and instructions included.',
    'Puzzle 500 Pieces Landscape': 'Challenge your mind with this stunning 500-piece landscape jigsaw puzzle. Featuring a high-resolution, vibrant image of a picturesque nature scene, printed on thick, premium puzzle board. Precision-cut pieces ensure a satisfying, snug fit.',
    'Art & Craft Kit Kids': 'Spark artistic imagination with this complete kids\' art and craft kit. Packed with colorful markers, crayons, colored pencils, safety scissors, glue, sketchbooks, and fun crafting supplies. All components are non-toxic, washable, and perfect for school projects or home creativity.',
    'Educational Alphabet Blocks': 'Help your little ones learn while playing with these classic wooden alphabet and number blocks. Made from solid, natural wood with rounded edges and non-toxic paint. Features bright letters, numbers, and pictures to develop early cognitive and motor skills.',
    'Action Figure Set': 'Bring epic battles to life with this detailed action figure set. Featuring highly posable figures with multiple points of articulation and character-specific accessories. Crafted from durable plastic, they are perfect for imaginative storytelling and collector displays.',
    'Soft Play Ball Set': 'Provide safe active fun with this set of colorful soft play balls. Perfect for ball pits, play tents, and toddler activities. Made from phthalate-free, air-filled crush-proof plastic, they are soft and easy for small hands to grasp, toss, and catch.',
    'Science Experiment Kit': 'Introduce young minds to the wonders of STEM with this hands-on science experiment kit. Includes safe, easy-to-use lab tools and step-by-step instructions for performing dozens of exciting experiments in chemistry, physics, and biology. Perfect for curious young scientists.',

    // Groceries
    'Basmati Rice 5kg': 'Enjoy the aromatic goodness of premium, long-grain Basmati rice. Aged to perfection to enhance its rich aroma and delicate flavor, the grains cook up fluffy, separate, and non-sticky. An ideal choice for preparing biryani, pilaf, or daily steamed rice dishes.',
    'Whole Wheat Flour 2kg': 'Bake healthy and delicious flatbreads with this premium 100% stone-ground whole wheat flour. Made from high-quality wheat grains, it retains natural bran and nutrients for a soft, nutritious texture. Perfect for preparing traditional rotis, chapatis, and parathas.',
    'Sunflower Cooking Oil 1L': 'Cook healthy and light meals with this premium, refined sunflower cooking oil. Naturally high in Vitamin E and low in saturated fats, it has a high smoke point that makes it ideal for deep frying, sautéing, baking, and everyday cooking. Neutral taste preserves food flavors.',
    'Organic Honey 500g': 'Sweeten your dishes naturally with this 100% pure, raw organic honey. Sourced from organic wildflowers, it is gently filtered to preserve its natural enzymes, pollen, and rich floral flavor. Free from artificial sugars, preservatives, or additives.',
    'Green Tea Bags 100 Pack': 'Relax and rejuvenate with this pack of premium green tea bags. Sourced from high-altitude organic tea gardens, these hand-selected leaves deliver a smooth, refreshing cup rich in natural antioxidants. Perfect for boosting energy and supporting overall wellness.',
    'Instant Coffee 200g': 'Start your day with the rich, bold flavor of this premium instant coffee. Crafted from a blend of carefully roasted Arabica and Robusta beans, it dissolves instantly to deliver a smooth, aromatic cup of coffee with a rich crema. No coffee machine required.',
    'Mixed Dry Fruits 500g': 'Snack healthy with this premium blend of mixed dry fruits. A nutritious mix of whole almonds, cashews, walnuts, raisins, and pistachios. High in fiber, healthy fats, and essential vitamins, it makes a perfect daily energy snack or cooking ingredient.',
    'Tomato Ketchup 1kg': 'Add a tangy, sweet burst of flavor to your snacks with this classic tomato ketchup. Made from ripe, juicy red tomatoes and a blend of aromatic spices. Packaged in a convenient squeeze bottle, it is the perfect companion for burgers, fries, and sandwiches.',
    'Breakfast Cereal Corn Flakes': 'Start your morning with a crunchy, nutritious breakfast of classic golden corn flakes. Made from sun-ripened corn, they are enriched with essential vitamins and iron. Low in fat and high in energy, they pair perfectly with cold milk and fresh fruits.',
    'Olive Oil Extra Virgin 500ml': 'Elevate your culinary creations with this premium extra virgin olive oil. Cold-pressed from select, high-quality olives, it features a rich, fruity aroma and a smooth, peppery finish. Perfect for dressing fresh salads, drizzling over pasta, or sautéing.',

    // Automotive
    'Car Phone Mount Magnetic': 'Keep your hands free and drive safely with this powerful magnetic car phone mount. Equipped with strong neodymium magnets and a secure vent clip, it holds your phone firmly in place even on bumpy roads. Features a 360-degree rotating ball joint.',
    'Microfiber Cleaning Cloth Set': 'Keep your vehicle spotless with this pack of ultra-soft, lint-free microfiber cleaning cloths. Featuring high absorbency and scratch-free cleaning, they easily trap dirt, dust, and liquids without scratching paint or glass. Machine washable and reusable.',
    'Tyre Inflator Portable': 'Be prepared for emergencies with this compact, portable digital tyre inflator. Powered by your car\'s 12V outlet, it quickly inflates car, motorcycle, or bicycle tyres. Features a backlit digital display, automatic shut-off at preset pressure, and built-in LED light.',
    'Dashboard Phone Holder': 'Secure your phone firmly on your dashboard or windshield with this heavy-duty phone holder. Designed with a strong suction cup gel pad and an adjustable telescopic arm, it offers flexible viewing angles. Compatible with all major smartphone models.',
    'Car Air Freshener Pack': 'Keep your car smelling fresh and clean with this premium air freshener pack. Formulated to neutralize tough odors and release a long-lasting, refreshing fragrance. Easy to clip onto car vents, it provides up to 30 days of consistent fresh scent.',
    'Seat Cover Universal Set': 'Protect and upgrade your vehicle\'s interior with this universal seat cover set. Crafted from breathable, padded mesh fabric, they offer comfortable seating while shielding your original seats from spills, dirt, and wear. Easy to install and airbag compatible.',
    'Jump Starter Power Bank': 'Never get stranded with a dead car battery again. This multi-functional jump starter delivers up to 1000A peak current to start cars, trucks, and SUVs. Doubles as a high-capacity power bank with USB ports to charge phones, and a built-in LED emergency flashlight.',
    'Windshield Sun Shade': 'Keep your car interior cool and protect your dashboard from fading with this folding windshield sun shade. Designed with reflective metallic fabric that blocks harmful UV rays and heat. Folds compactly for easy storage in door pockets or under seats.',
    'Car Vacuum Cleaner Cordless': 'Keep your car cabin clean with this powerful, cordless handheld vacuum cleaner. Equipped with a high-speed motor for strong suction, a washable HEPA filter, and specialized attachments for crevice and upholstery cleaning. Light, compact, and easy to store.',
    'LED Headlight Bulbs Pair': 'Upgrade your nighttime visibility with this pair of ultra-bright LED headlight bulbs. Delivering crisp, daylight-white light with a focused beam pattern that doesn\'t blind oncoming traffic. Designed with advanced cooling fans and plug-and-play installation.'
  };

  return details[name] || `Premium ${name} category: ${category}. Crafted with high-quality materials to ensure performance, durability, and customer satisfaction.`;
};

const buildProducts = (vendorId) => {
  const products = [];

  Object.entries(CATEGORIES).forEach(([category, items]) => {
    const [minPrice, maxPrice] = PRICE_RANGES[category];

    items.forEach(({ name, image }, index) => {
      const isFashion = category === 'Fashion';
      let sizes = [];
      if (isFashion) {
        sizes = isFootwear(name)
          ? FOOTWEAR_SIZES
          : FASHION_SIZE_VARIANTS[index % FASHION_SIZE_VARIANTS.length];
      }

      const price = randomBetween(minPrice, maxPrice);
      // Give a discount to roughly 2/3 of products
      const hasDiscount = index % 3 !== 0;
      const discountPercent = hasDiscount ? randomBetween(15, 45) : 0;
      const originalPrice = hasDiscount ? Math.round(price / (1 - discountPercent / 100)) : undefined;

      products.push({
        name,
        description: getDetailedDescription(name, category),
        price,
        originalPrice,
        image,
        category,
        vendorId,
        rating: randomRating(),
        reviews: randomBetween(12, 480),
        stock: randomBetween(8, 120),
        sizes,
      });
    });
  });

  return products;
};

const ensureSeedVendor = async () => {
  const seedEmail = 'seed-vendor@unibox.local';
  let vendor = await Vendor.findOne({ email: seedEmail });

  if (!vendor) {
    vendor = new Vendor({
      name: 'UniBox Seed Vendor',
      email: seedEmail,
      mobile: "1234567890",
      password: 'SeedVendor@123',
      storeName: 'UniBox Demo Store',
    });
    await vendor.save();
    console.log('Created seed vendor:', seedEmail);
  } else {
    console.log('Using existing seed vendor:', seedEmail);
  }

  return vendor;
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const vendor = await ensureSeedVendor();

  const deleted = await Product.deleteMany({
    vendorId: vendor._id,
  });
  console.log(`Removed ${deleted.deletedCount} previous seed products`);

  const products = buildProducts(vendor._id);
  await Product.insertMany(products);

  const total = await Product.countDocuments();
  console.log(`Inserted ${products.length} seed products (${ITEMS_PER_CATEGORY} per category)`);
  console.log(`Total products in database: ${total}`);

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
