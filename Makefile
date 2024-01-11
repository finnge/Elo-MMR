# This Makefile target, 'mmrFast', runs a Rust program to calculate player ratings based on contest results.
# It takes three variables as input: 'ALGORITHM', 'DATASET', and 'NUM_OF_CONTESTS'.
# Example usage: make run ALGORITHM=mmr-fast DATASET=dataset NUM_OF_CONTESTS=10
run:
	@echo "Running $(ALGORITHM) algorithm on $(DATASET) dataset for $(NUM_OF_CONTESTS) contests"

	@echo "Resetting data/$(DATASET)"
	@rm -rf data/$(DATASET)

	@echo "Creating directory data/$(DATASET)/rounds"
	@mkdir -p data/$(DATASET)/rounds

	@echo "Change to multi-skill directory and run $(ALGORITHM)"

	for numOfContests in $$(seq 1 $(NUM_OF_CONTESTS)); do \
		cd multi-skill && RUSTFLAGS="-Awarnings" cargo run --release --bin rate $(ALGORITHM) $(DATASET) $$numOfContests; \
		mv ../data/$(DATASET)/all_players.csv ../data/$(DATASET)/rounds/scores_until_$$numOfContests.csv ; \
		rm -rf data/$(DATASET)/players ; \
		cd .. ; \
	done
	
time:
	@echo "Running $(ALGORITHM) algorithm on $(DATASET) dataset for round $(ROUND) $(REPEATS) times"

	@echo "Resetting data/$(DATASET)"
	@rm -rf data/$(DATASET)

	for repeat in $$(seq 1 $(REPEATS)); do \
		echo "Repeat $$repeat of $(REPEATS)"; \
		echo "Change to multi-skill directory and run $(ALGORITHM)" ; \
		cd multi-skill && RUSTFLAGS="-Awarnings" cargo run --release --bin rate $(ALGORITHM) $(DATASET) $(ROUND); \
		rm -rf data/$(DATASET) ; \
		cd .. ; \
	done

new_dataset := $(DATASET)-$(PLAYER)-$(ALGORITHM)-$(NORMAL_ROUNDS)-$(END_FARMING_ROUNDS)-$(VOLATILITY_THRESHOLD)

volatility_farming:
	@echo "Creates volatility farming dataset for $(ALGORITHM) on $(DATASET) dataset"

	@echo "Player $(PLAYER) will play normal for $(NORMAL_ROUNDS) rounds and farm volatility for $(END_FARMING_ROUNDS) rounds to stay below $(VOLATILITY_THRESHOLD) volatility"

	@echo "Resetting data/$(new_dataset)"
	@rm -rf data/$(new_dataset)

	@echo "Resetting cache/$(new_dataset)"
	@rm -rf cache/$(new_dataset)

	@echo "Creating cache directory cache/$(new_dataset)"
	@mkdir -p cache/$(new_dataset)

	@echo "Copy cache/$(DATASET) to cache/$(new_dataset)"
	@cp cache/$(DATASET)/* cache/$(new_dataset)

	@echo "Initially run $(ALGORITHM) on $(DATASET) dataset for $(NORMAL_ROUNDS) rounds"

	@cd multi-skill && cargo run --release --bin rate $(ALGORITHM) $(new_dataset) $(NORMAL_ROUNDS) && cd ..

	for repeat in $$(seq $(NORMAL_ROUNDS) $(END_FARMING_ROUNDS)); do \
		echo "Repeat $$repeat of $(END_FARMING_ROUNDS)"; \
		deno run --allow-read --allow-write changeDataIfVolaitlity.ts --dataset=$(new_dataset) --maxVolatility=$(VOLATILITY_THRESHOLD) --player=$(PLAYER) --round=$$repeat; \
		echo "Change to multi-skill directory and run $(ALGORITHM)" ; \
		cd multi-skill && RUSTFLAGS="-Awarnings" cargo run --release --bin rate $(ALGORITHM) $(new_dataset) $$repeat; \
		rm -rf data/$(new_dataset) ; \
		cd .. ; \
	done

	@make run ALGORITHM=tcsys DATASET=$(new_dataset) NUM_OF_CONTESTS=300

	@deno run --allow-read --allow-write combine.ts --dataset=$(new_dataset)

# TOURIST MMR

vf_tourist_mmr: 
	@make volatility_farming PLAYER=tourist NORMAL_ROUNDS=45 END_FARMING_ROUNDS=90 VOLATILITY_THRESHOLD=2400 ALGORITHM=mmr-fast DATASET=mycodeforces

vf_tourist_glicko:
	@make volatility_farming PLAYER=tourist NORMAL_ROUNDS=45 END_FARMING_ROUNDS=90 VOLATILITY_THRESHOLD=1600 ALGORITHM=glicko DATASET=mycodeforces

vf_tourist_tcsys:
	@make volatility_farming PLAYER=tourist NORMAL_ROUNDS=45 END_FARMING_ROUNDS=90 VOLATILITY_THRESHOLD=2975 ALGORITHM=tcsys DATASET=mycodeforces

# run_tourist_mmr:
# 	@make run ALGORITHM=mmr-fast DATASET=mycodeforces-tourist-mmr-fast-45-90-2400 NUM_OF_CONTESTS=300

# run_tourist_glicko:
# 	@make run ALGORITHM=glicko DATASET=mycodeforces-tourist-glicko-45-90-1600 NUM_OF_CONTESTS=300

# run_tourist_tcsys:
# 	@make run ALGORITHM=tcsys DATASET=mycodeforces-tourist-tcsys-45-90-2975 NUM_OF_CONTESTS=300

# combine_tourist_mmr:
# 	deno run --allow-read --allow-write combine.ts --dataset=mycodeforces-tourist-mmr-fast-45-90-2400

# combine_tourist_glicko:
# 	deno run --allow-read --allow-write combine.ts --dataset=mycodeforces-tourist-glicko-45-90-1600

# combine_tourist_tcsys:
# 	deno run --allow-read --allow-write combine.ts --dataset=mycodeforces-tourist-tcsys-45-90-2975

combine:
	deno run --allow-read --allow-write combine.ts

pgfplots:
	deno run --allow-read --allow-write pgfplots.ts
