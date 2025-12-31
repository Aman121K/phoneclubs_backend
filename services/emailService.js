const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Use environment variables for email configuration
  // For development, you can use Gmail or other SMTP services
  // For production, use a proper email service like SendGrid, AWS SES, etc.

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'javascript.pgl@gmail.com',
      pass: 'msdf qhmj fhbv xlbm'
    },
  });

  return transporter;
};

// Send bid notification email to seller
const sendBidNotificationEmail = async (sellerEmail, sellerName, buyerName, itemTitle, bidAmount, auctionId) => {
  try {
    // If email is not configured, just log and return
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('Email not configured. Would send bid notification to:', sellerEmail);
      console.log(`Buyer: ${buyerName} bid AED ${bidAmount} on "${itemTitle}"`);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"PhoneClubs" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: `New Bid on Your Auction: ${itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #f97316 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .bid-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .bid-amount { font-size: 24px; font-weight: bold; color: #f97316; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Bid Received!</h1>
            </div>
            <div class="content">
              <p>Hello ${sellerName},</p>
              <p>Great news! You have received a new bid on your auction item.</p>
              
              <div class="bid-info">
                <p><strong>Item:</strong> ${itemTitle}</p>
                <p><strong>Buyer:</strong> ${buyerName}</p>
                <div class="bid-amount">Bid Amount: AED ${bidAmount.toLocaleString()}</div>
              </div>
              
              <p>Your auction is getting attention! The current highest bid is now <strong>AED ${bidAmount.toLocaleString()}</strong>.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auction/${auctionId}" class="button">View Auction</a>
              
              <p style="margin-top: 30px;">Thank you for using PhoneClubs!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PhoneClubs. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Bid on Your Auction
        
        Hello ${sellerName},
        
        Great news! You have received a new bid on your auction item.
        
        Item: ${itemTitle}
        Buyer: ${buyerName}
        Bid Amount: AED ${bidAmount.toLocaleString()}
        
        Your auction is getting attention! The current highest bid is now AED ${bidAmount.toLocaleString()}.
        
        View your auction: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auction/${auctionId}
        
        Thank you for using PhoneClubs!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Bid notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending bid notification email:', error);
    // Don't fail the request if email fails
    return { success: false, error: error.message };
  }
};

// Send auction winner payment email
const sendWinnerPaymentEmail = async (winnerEmail, winnerName, itemTitle, bidAmount, paymentLink, paymentDeadline) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('Email not configured. Would send winner payment email to:', winnerEmail);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();
    const deadlineDate = new Date(paymentDeadline).toLocaleString('en-US', { 
      timeZone: 'Asia/Dubai',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const mailOptions = {
      from: `"PhoneClubs" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: winnerEmail,
      subject: `🎉 You Won! Complete Your Payment - ${itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .winner-info { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .amount { font-size: 28px; font-weight: bold; color: #10b981; margin: 15px 0; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .warning { background: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations! You Won the Auction!</h1>
            </div>
            <div class="content">
              <p>Hello ${winnerName},</p>
              <p>Congratulations! You are the winning bidder for this auction item.</p>
              
              <div class="winner-info">
                <p><strong>Item:</strong> ${itemTitle}</p>
                <p><strong>Your Winning Bid:</strong></p>
                <div class="amount">AED ${bidAmount.toLocaleString()}</div>
              </div>
              
              <div class="deadline">
                <p><strong>⏰ Payment Deadline:</strong> ${deadlineDate}</p>
                <p>Please complete your payment before this deadline to secure your purchase.</p>
              </div>
              
              <div class="warning">
                <p><strong>⚠️ Important:</strong> If you fail to complete payment within the deadline, your account will be permanently blocked, and the second highest bidder will be given the opportunity to purchase.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">Complete Payment Now</a>
              </div>
              
              <p style="margin-top: 30px;">Thank you for using PhoneClubs!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PhoneClubs. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Congratulations! You Won the Auction!
        
        Hello ${winnerName},
        
        Congratulations! You are the winning bidder for this auction item.
        
        Item: ${itemTitle}
        Your Winning Bid: AED ${bidAmount.toLocaleString()}
        
        Payment Deadline: ${deadlineDate}
        Please complete your payment before this deadline to secure your purchase.
        
        Important: If you fail to complete payment within the deadline, your account will be permanently blocked, and the second highest bidder will be given the opportunity to purchase.
        
        Complete Payment: ${paymentLink}
        
        Thank you for using PhoneClubs!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Winner payment email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending winner payment email:', error);
    return { success: false, error: error.message };
  }
};

// Send second bidder payment email
const sendSecondBidderPaymentEmail = async (bidderEmail, bidderName, itemTitle, bidAmount, paymentLink) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('Email not configured. Would send second bidder payment email to:', bidderEmail);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"PhoneClubs" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: bidderEmail,
      subject: `🎯 Opportunity: Complete Payment for ${itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .amount { font-size: 28px; font-weight: bold; color: #f59e0b; margin: 15px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Opportunity Available!</h1>
            </div>
            <div class="content">
              <p>Hello ${bidderName},</p>
              <p>Good news! The previous winner was unable to complete payment, and you now have the opportunity to purchase this item.</p>
              
              <div class="info">
                <p><strong>Item:</strong> ${itemTitle}</p>
                <p><strong>Your Bid Amount:</strong></p>
                <div class="amount">AED ${bidAmount.toLocaleString()}</div>
              </div>
              
              <p>You have 48 hours to complete your payment. Don't miss this opportunity!</p>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">Complete Payment Now</a>
              </div>
              
              <p style="margin-top: 30px;">Thank you for using PhoneClubs!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PhoneClubs. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Opportunity Available!
        
        Hello ${bidderName},
        
        Good news! The previous winner was unable to complete payment, and you now have the opportunity to purchase this item.
        
        Item: ${itemTitle}
        Your Bid Amount: AED ${bidAmount.toLocaleString()}
        
        You have 48 hours to complete your payment. Don't miss this opportunity!
        
        Complete Payment: ${paymentLink}
        
        Thank you for using PhoneClubs!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Second bidder payment email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending second bidder payment email:', error);
    return { success: false, error: error.message };
  }
};

// Send payment reminder email
const sendPaymentReminderEmail = async (userEmail, userName, itemTitle, bidAmount, paymentLink, hoursRemaining) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('Email not configured. Would send payment reminder to:', userEmail);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"PhoneClubs" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⏰ Payment Reminder: ${hoursRemaining} Hours Remaining`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reminder { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; text-align: center; }
            .time { font-size: 32px; font-weight: bold; color: #ef4444; margin: 10px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>This is a reminder that you have a pending payment for your auction win.</p>
              
              <div class="reminder">
                <p><strong>Time Remaining:</strong></p>
                <div class="time">${hoursRemaining} Hours</div>
              </div>
              
              <p><strong>Item:</strong> ${itemTitle}</p>
              <p><strong>Amount:</strong> AED ${bidAmount.toLocaleString()}</p>
              
              <p><strong>⚠️ Important:</strong> Please complete your payment before the deadline to avoid account blocking.</p>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">Complete Payment Now</a>
              </div>
              
              <p style="margin-top: 30px;">Thank you for using PhoneClubs!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PhoneClubs. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Payment Reminder
        
        Hello ${userName},
        
        This is a reminder that you have a pending payment for your auction win.
        
        Time Remaining: ${hoursRemaining} Hours
        
        Item: ${itemTitle}
        Amount: AED ${bidAmount.toLocaleString()}
        
        Important: Please complete your payment before the deadline to avoid account blocking.
        
        Complete Payment: ${paymentLink}
        
        Thank you for using PhoneClubs!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending payment reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send featured listing payment confirmation
const sendFeaturedListingPaymentEmail = async (sellerEmail, sellerName, listingTitle, paymentLink) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('Email not configured. Would send featured listing payment email to:', sellerEmail);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"PhoneClubs" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: `✨ Feature Your Listing: ${listingTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .button { display: inline-block; padding: 15px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Feature Your Listing!</h1>
            </div>
            <div class="content">
              <p>Hello ${sellerName},</p>
              <p>Make your listing stand out! Pay to feature your listing at the top of search results and get more visibility.</p>
              
              <div class="info">
                <p><strong>Listing:</strong> ${listingTitle}</p>
                <p><strong>Benefits of Featured Listing:</strong></p>
                <ul>
                  <li>✅ Appears at the top of search results</li>
                  <li>✅ Higher visibility and more views</li>
                  <li>✅ Increased chances of quick sale</li>
                  <li>✅ Premium placement on category pages</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">Pay to Feature Listing</a>
              </div>
              
              <p style="margin-top: 30px;">Thank you for using PhoneClubs!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PhoneClubs. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Feature Your Listing!
        
        Hello ${sellerName},
        
        Make your listing stand out! Pay to feature your listing at the top of search results and get more visibility.
        
        Listing: ${listingTitle}
        
        Benefits of Featured Listing:
        - Appears at the top of search results
        - Higher visibility and more views
        - Increased chances of quick sale
        - Premium placement on category pages
        
        Pay to Feature: ${paymentLink}
        
        Thank you for using PhoneClubs!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Featured listing payment email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending featured listing payment email:', error);
    return { success: false, error: error.message };
  }
};

// Send new listing notification to all subscribers
const sendNewListingNotification = async (listingData) => {
  try {
    const Subscription = require('../models/Subscription');
    
    // Get all active subscribers
    const subscribers = await Subscription.find({ isActive: true });
    
    if (subscribers.length === 0) {
      console.log('No active subscribers to notify');
      return { success: true, notified: 0 };
    }

    // If email is not configured, just log and return
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log(`Email not configured. Would notify ${subscribers.length} subscribers about new listing: ${listingData.title}`);
      return { success: true, notified: subscribers.length, skipped: true };
    }

    const transporter = createTransporter();
    const listingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/listing/${listingData.id}`;
    const categoryName = listingData.categoryName || 'Phone';
    const sellerName = listingData.sellerName || 'Seller';
    const city = listingData.city || 'Your Area';

    // Prepare email content
    const mailOptions = {
      from: `"PhoneClubs" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      subject: `📱 New ${categoryName} Listing: ${listingData.title} - ₹${listingData.price}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 30px; background: #f8fafc; }
            .listing-card { background: white; border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .listing-image { width: 100%; max-width: 300px; height: 200px; object-fit: cover; border-radius: 8px; margin: 15px auto; display: block; }
            .listing-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 15px 0 10px; }
            .listing-price { font-size: 28px; font-weight: 700; color: #10b981; margin: 15px 0; }
            .listing-details { display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0; }
            .detail-item { flex: 1; min-width: 120px; }
            .detail-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .detail-value { font-size: 14px; color: #1e293b; font-weight: 500; margin-top: 4px; }
            .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; text-align: center; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; background: #f8fafc; }
            .unsubscribe { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
            .unsubscribe a { color: #64748b; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📱 New Phone Listing!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">A new phone has been listed near you</p>
            </div>
            <div class="content">
              <div class="listing-card">
                ${listingData.imageUrl ? `<img src="${listingData.imageUrl}" alt="${listingData.title}" class="listing-image" />` : ''}
                <h2 class="listing-title">${listingData.title}</h2>
                <div class="listing-price">₹${listingData.price.toLocaleString('en-IN')}</div>
                
                <div class="listing-details">
                  <div class="detail-item">
                    <div class="detail-label">Category</div>
                    <div class="detail-value">${categoryName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Condition</div>
                    <div class="detail-value">${listingData.condition || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Storage</div>
                    <div class="detail-value">${listingData.storage || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${city}</div>
                  </div>
                </div>
                
                ${listingData.description ? `<p style="color: #475569; margin: 15px 0; line-height: 1.6;">${listingData.description.substring(0, 150)}${listingData.description.length > 150 ? '...' : ''}</p>` : ''}
                
                <div style="text-align: center; margin-top: 25px;">
                  <a href="${listingUrl}" class="button">View Listing</a>
                </div>
              </div>
              
              <p style="color: #64748b; margin-top: 20px; text-align: center;">
                Don't miss out on great deals! Check out this new listing from ${sellerName}.
              </p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you subscribed to PhoneClubs notifications.</p>
              <div class="unsubscribe">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email={{EMAIL}}">Unsubscribe</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Visit PhoneClubs</a>
              </div>
              <p style="margin-top: 15px;">© 2025 PhoneClubs. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Phone Listing on PhoneClubs!
        
        ${listingData.title}
        Price: ₹${listingData.price.toLocaleString('en-IN')}
        Category: ${categoryName}
        Condition: ${listingData.condition || 'N/A'}
        Storage: ${listingData.storage || 'N/A'}
        Location: ${city}
        Seller: ${sellerName}
        
        ${listingData.description ? listingData.description.substring(0, 200) : ''}
        
        View Listing: ${listingUrl}
        
        You're receiving this email because you subscribed to PhoneClubs notifications.
        Unsubscribe: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email={{EMAIL}}
      `
    };

    // Send emails to all subscribers (in batches to avoid overwhelming the server)
    const batchSize = 10;
    let notified = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (subscriber) => {
          try {
            const personalizedHtml = mailOptions.html.replace(/\{\{EMAIL\}\}/g, subscriber.email);
            const personalizedText = mailOptions.text.replace(/\{\{EMAIL\}\}/g, subscriber.email);
            
            await transporter.sendMail({
              ...mailOptions,
              to: subscriber.email,
              html: personalizedHtml,
              text: personalizedText
            });
            
            // Update last notified timestamp
            subscriber.lastNotifiedAt = new Date();
            await subscriber.save();
            
            notified++;
          } catch (error) {
            console.error(`Failed to send notification to ${subscriber.email}:`, error);
            failed++;
          }
        })
      );
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`New listing notification sent: ${notified} successful, ${failed} failed`);
    return { success: true, notified, failed };
  } catch (error) {
    console.error('Send new listing notification error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBidNotificationEmail,
  sendWinnerPaymentEmail,
  sendSecondBidderPaymentEmail,
  sendPaymentReminderEmail,
  sendFeaturedListingPaymentEmail,
  sendNewListingNotification
};

