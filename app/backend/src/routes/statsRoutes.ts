import { Router } from 'express';
import { getIncidentTypePredictions } from '../services/statsService';

const router = Router();

router.get('/incident-predictions', async (_, res) => {
    console.log('GET /stats/incident-predictions');
    try {
        const predictions = await getIncidentTypePredictions();
        res.json(predictions);
    } catch (error) {
        console.error('Error getting incident predictions:', error);
        res.status(500).json({ error: 'Failed to get incident predictions' });
    }
});

export default router;