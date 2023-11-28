# This Makefile target, 'mmrFast', runs a Rust program to calculate player ratings based on contest results.
# It takes three variables as input: 'ALGORITHM', 'DATASET', and 'NUM_OF_CONTESTS'.
# Example usage: make run ALGORITHM=mmr-fast DATASET=dataset NUM_OF_CONTESTS=10
run:
	@echo "Running mmrFast with $(ALGORITHM) algorithm on $(DATASET) dataset for $(NUM_OF_CONTESTS) contests"

	@echo "Resetting data/$(DATASET)"
	@rm -rf data/$(DATASET)

	@echo "Creating directory data/$(DATASET)/rounds"
	@mkdir -p data/$(DATASET)/rounds

	@echo "Change to multi-skill directory and run $(ALGORITHM)"

	for numOfContests in $$(seq 1 $(NUM_OF_CONTESTS)); do \
		(cd multi-skill && cargo run --release --bin rate $(ALGORITHM) $(DATASET) $$numOfContests; \
		mv ../data/$(DATASET)/all_players.csv ../data/$(DATASET)/rounds/scores_until_$$numOfContests.csv ; \
		rm -rf data/$(DATASET)/players ; \
		cd .. ; ) & \
	done
	

combine:
	deno run --allow-read --allow-write main.ts