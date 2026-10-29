

export const sampleText =
    'Samsung Electronics constantly reinvents the future and explores the unknown to discover technologies that help people all over the world lead happier, healthier lives.Are you looking to gift a techie or someone who appreciates the latest gadgets, but you aren’t sure what you should choose? Samsung Brand Shops have the latest Mobiles, Televisions, Appliances, and Accessories that provide the perfect selection for them. All it takes is just a few clicks, and you loved ones will receive the Samsung eGift Card, which they can use to then get themselves something that they have been wanting for a long time, or they can explore the collection at the store and choose their favourite product, making your gift an instant success!You could gift it on Birthdays, Anniversaries or the special days on the calendar, which are meant just for those special people in our lives, like Valentine’s Day, Mother’s Day or Father’s Day. You could also say “Thank You” with this great gesture or surprise a friend with this incredible gift, just to bring a smile on their face! A gift like this is also sure to add joy on festivals like Eid, Christmas or Diwali, when gifted to near and dear ones!You can even customize your Samsung eGift card and choose a theme from our many designs which cover all occasions and events, and then personalize it with a message, picture, or a video, and send it instantly or schedule a perfect time in advance. Your loved one will receive their Samsung Gift Card conveniently on their email or via SMS, with an exciting digital unwrapping experience. They can then walk into any of the listed Samsung Electronics store in UAE with their Samsung eGift card and walk out with the gifts of their choice! This is gifting made easy, fun, convenient and safe! This is gifting with YouGotaGift';

export const giftCardPrice = [100, 200, 300, 400];

export const filterOptions = [
    { key: 1, value: 'All', label: 'Sample house, India' },
    { key: 2, value: 'Popular', label: 'Sample house, UAE' },
];
export const genderOptions = [
    { key: 1, id: 1, value: 'male', label: 'Male', name: 'Male' },
    { key: 2, id: 2, value: 'female', label: 'Female', name: 'Female' },
];

interface DataType {
    key: React.Key;
    name: string;
    age: number;
    address: string;
}

export const CheckoutTableData: DataType[] = [
    {
        key: '1',
        name: 'John Brown',
        age: 32,
        address: 'New York No. 1 Lake Park',
    },
];

export const giftCardCategories = [
    { key: 'all', label: 'All' },
    { key: 'fashion', label: 'Fashion and Lifestyle' },
    { key: 'food', label: 'Food and Restaurant' },
    { key: 'travel', label: 'Travel and Entertainment' },
    { key: 'electronics', label: 'Electronics' },
    { key: 'grocery', label: 'Grocery' },
    { key: 'sports', label: 'Wellness and Sports' },
    { key: 'jewellery', label: 'Gold and Jewellery' },
    { key: 'gaming', label: 'Gaming' },
    { key: 'others', label: 'Others' },
];

interface filterOption {
    value: string;
    label: string;
}
export const filterOptionsInListing: filterOption[] = [
  
    {
        value: 'name',
        label: 'Name',
    },
    {
        value: 'popular',
        label: 'Popular',
    },
      {
        value: 'all',
        label: 'All',
    },
];
