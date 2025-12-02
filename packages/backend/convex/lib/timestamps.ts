export const now = () => Date.now();

export const createTimestamps = () => {
	const timestamp = now();
	return { createdAt: timestamp, updatedAt: timestamp };
};

export const updateTimestamp = () => ({ updatedAt: now() });
