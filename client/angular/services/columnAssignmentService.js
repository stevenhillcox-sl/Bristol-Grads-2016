(function() {
    angular
        .module("TwitterWallApp")
        .factory("columnAssignmentService", columnAssignmentService);

    columnAssignmentService.$inject = [];

    function columnAssignmentService() {
        return {
            ColumnData: ColumnData,
            assignColumns: assignColumns,
            sortColumns: sortColumns,
            backfillColumns: backfillColumns,
        };

        // Metadata for an individual tweet column
        function ColumnData(slots, selector, ordering, extraContentSpacing) {
            this.slots = slots;
            this.selector = selector;
            this.ordering = ordering;
            //variable to keep track of extra content in each column, eg the logo and "get involved" message
            //units are vh, a percentage of the column height e.g. 0.2 means 20% of the column should be ignored
            this.extraContentSpacing = extraContentSpacing;
        }

        function assignColumns(tweets, columnDataList) {
            // Set columnList to an array of length equal to columnDataList, consisting of empty arrays
            var columnList = columnDataList.map(function() {
                return [];
            });
            tweets.forEach(function(tweet) {
                // Find the index of the first column that matches the tweet
                var columnIndex = columnDataList.findIndex(function(columnData) {
                    return columnData.selector(tweet);
                });
                columnList[columnIndex].push(tweet);
            });
            return columnList;
        }

        function sortColumns(columnList, columnDataList) {
            return columnList.map(function(column, idx) {
                return sortColumn(column, columnDataList[idx]);
            });
        }

        function sortColumn(column, columnData) {
            return column.slice().sort(columnData.ordering);
        }

        function backfillColumns(columnList, columnDataList) {
            var filledColumnList = columnDataList.map(function() {
                return [];
            });
            var freeSlots = columnDataList.map(function(column) {
                return column.slots;
            });
            var unassignedPinned = [];
            var overflow = [];
            //gredily "fill" each column
            columnList.forEach(function truncate(column, idx) {
                column.forEach(function(tweet) {
                    if (weight(tweet) <= freeSlots[idx]) {
                        filledColumnList[idx].push(tweet);
                        freeSlots[idx] -= weight(tweet);
                    } else {
                        if (tweet.pinned) {
                            unassignedPinned.push(tweet);
                        } else {
                            overflow.push(tweet);
                        }
                    }
                });
                //if there's another column to be processed put any remaining pinned tweets in it
                if (columnList.length - 1 > idx) {
                    columnList[idx + 1] = unassignedPinned.concat(columnList[idx + 1]);
                    unassignedPinned = [];
                }
            });
            //fill any remaining slots
            filledColumnList.forEach(function(column, idx) {
                var tweetIndex = 0;
                while (freeSlots[idx] > 0 && tweetIndex < overflow.length) {
                    var tweet = overflow[tweetIndex];
                    if (weight(tweet) <= freeSlots[idx]) {
                        filledColumnList[idx].push(tweet);
                        freeSlots[idx] -= weight(tweet);
                        overflow.splice(tweetIndex, 1);
                    }
                    tweetIndex++;
                }
            });
            return filledColumnList;
        }

        function weight(tweet) {
            return (tweet.entities.media) ? 2 : 1;
        }
    }

})();
