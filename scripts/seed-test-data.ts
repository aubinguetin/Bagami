
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding test data...');

    // 0. Cleanup old test data (to avoid unique constraint violations on phone)
    const emailsToDelete = [
        'test_buyer@bagami.com',
        'test_seller@bagami.com',
        'bagami_buyer@mailinator.com',
        'bagami_seller@mailinator.com',
        'test@mailinator.com'
    ];
    await prisma.user.deleteMany({
        where: { email: { in: emailsToDelete } }
    });
    console.log('🧹 Cleaned up old test users');

    // 1. Create User A (Buyer/Payer)
    const userAEmail = 'test@mailinator.com';
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const userA = await prisma.user.upsert({
        where: { email: userAEmail },
        update: {},
        create: {
            email: userAEmail,
            name: 'Test Buyer',
            password: hashedPassword,
            phone: '70000001',
            countryCode: '+226',
            role: 'user',
            isActive: true,
            wallet: {
                create: {
                    balance: 10000,
                    currency: 'XOF'
                }
            }
        },
    });
    console.log(`✅ Created User A: ${userA.email}`);

    // 2. Create User B (Seller/Traveler)
    const userBEmail = 'bagami_seller@mailinator.com';
    const userB = await prisma.user.upsert({
        where: { email: userBEmail },
        update: {},
        create: {
            email: userBEmail,
            name: 'Test Seller',
            password: hashedPassword, // Same password
            phone: '70000002',
            countryCode: '+226',
            role: 'user',
            isActive: true,
            wallet: {
                create: {
                    balance: 0,
                    currency: 'XOF'
                }
            }
        },
    });
    console.log(`✅ Created User B: ${userB.email}`);

    // 3. Create a Delivery Offer from User B
    const delivery = await prisma.delivery.create({
        data: {
            sender: { connect: { id: userB.id } },
            title: 'Test Delivery from Paris to Ouaga',
            description: 'Bringing documents',
            type: 'offer',
            fromCountry: 'France',
            fromCity: 'Paris',
            toCountry: 'Burkina Faso',
            toCity: 'Ouagadougou',
            departureDate: new Date(Date.now() + 86400000), // Tomorrow
            price: 5000,
            currency: 'XOF',
            status: 'open',
            weight: 1.0,
        }
    });
    console.log(`✅ Created Delivery: ${delivery.id}`);

    // 4. Create Conversation between A and B
    const conversation = await prisma.conversation.create({
        data: {
            deliveryId: delivery.id,
            participant1Id: userA.id,
            participant2Id: userB.id,
            updatedAt: new Date(),
            lastMessageAt: new Date(),
        }
    });
    console.log(`✅ Created Conversation: ${conversation.id}`);

    // 5. Create an Agreed Offer (Message) so payment is possible
    const offerContent = JSON.stringify({
        price: 5000,
        currency: 'XOF',
        status: 'accepted'
    });

    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            senderId: userB.id, // Seller sent offer
            content: offerContent,
            messageType: 'offer',
            isRead: false
        }
    });
    console.log(`✅ Created Accepted Offer in Conversation`);

    console.log('🎉 Seeding complete!');
    console.log(`ℹ️ Login as Buyer: ${userAEmail} / Password123!`);
    console.log(`ℹ️ Payment Page URL: /payment-summary/${conversation.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
