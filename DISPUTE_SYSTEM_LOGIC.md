# Dispute Resolution System Logic

## 1. Schema Overview
- `disputes`: Main table storing dispute details, status, and participants.
- `dispute_evidence`: Table for uploading proof (images, logs).
- `dispute_messages`: Table for the real-time chat between Buyer, Seller, and Admin.

## 2. User Flow
### Initiation (Buyer)
- Buyers can open a dispute from their **Orders** page (`/buyers/orders`).
- A `DisputeModal` collects the reason and description.
- Once created, a row is added to the `disputes` table with status `pending`.

### Chatting (Buyer, Seller, Admin)
- All parties involved can access the dispute chat via their respective dashboards.
- The `DisputeChat` component handles the live communication.
- **Live Updates:** Powered by Supabase Realtime. When a new message is inserted, all connected parties receive a notification and refresh their message list.
- **RLS Security:** Row Level Security ensures that only the Buyer, Seller, and Admin can view or send messages for a specific dispute.

### Resolution (Admin)
- Admins view all disputes in the **Admin Dashboard** (`/admin/disputes`).
- They can participate in the chat to gather more info.
- Admins can update the status to `resolved`, `under_review`, etc., and provide a final resolution message.

## 3. Key Services
- `src/services/dispute-service.ts`: Contains functions for CRUD operations and messaging.
- `src/components/DisputeChat.tsx`: React component managing the Realtime subscription and UI.

## 4. Troubleshooting
- **Chat not updating?** Ensure the `dispute_messages` table is added to the `supabase_realtime` publication.
- **Permission denied?** Check RLS policies in `011_create_disputes.sql` and `012_create_dispute_messages.sql`.
- **Unique Constraint Error in Reviews?** Fixed by checking for existing reviews before submission and allowing updates instead of inserts.
