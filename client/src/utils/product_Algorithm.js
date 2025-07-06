

export const rankProducts = (listings) => {
    // ranking criteria
    listings.forEach(listing => {
      // product rasnk
      listing.rank = calculateProductRank(listing);
  
      // product visits
      listing.rank += calculateProductVisits(listing);
  
      // time listed
      listing.rank += calculateRecency(listing);
  
      // user behaviour
      listing.rank += calculateUserBehavior(listing);
  
      // lower price
      listing.rank += calculatePriceRank(listing);
  
      // stocks availability
      listing.rank += calculateStockAvailability(listing);
    });
  
    // sort listings by rank (highest rank is #1)
    listings.sort((a, b) => a.rank - b.rank);
    return listings;
  };
  
  const calculateProductRank = (listing) => {
    // lower means better rank
    return listing.productRank || 0;
  };
  
  const calculateProductVisits = (listing) => {
    // higher means better rank
    return listing.visits || 0;
  };
  
  const calculateRecency = (listing) => {
    // the older, the better rank
    const creationDate = new Date(listing.createdAt);
    const currentDate = new Date();
    const timeDifference = currentDate - creationDate;
    return timeDifference;
  };
  
  const calculateUserBehavior = (listing) => {
    // user interaction = higher rank
    return listing.userBehavior || 0;
  };
  
  const calculatePriceRank = (listing) => {
    // lower price = better rank 
    return listing.price || 0;
  };
  
  const calculateStockAvailability = (listing) => {
    // higher stock = better rank
    return listing.stock || 0;
  };
  