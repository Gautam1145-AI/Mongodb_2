package com.ticketbooking.dto;

public class ExplainResultDto {
    private String queryName;
    private String collection;
    private String filterDescription;
    private String winningStage;
    private String indexUsed;
    private long totalDocsExamined;
    private long totalKeysExamined;
    private long nReturned;
    private double executionTimeMillis;
    private boolean indexOptimal;
    private String explanation;

    public ExplainResultDto() {
    }

    public ExplainResultDto(String queryName, String collection, String filterDescription,
                            String winningStage, String indexUsed, long totalDocsExamined,
                            long totalKeysExamined, long nReturned, double executionTimeMillis,
                            boolean indexOptimal, String explanation) {
        this.queryName = queryName;
        this.collection = collection;
        this.filterDescription = filterDescription;
        this.winningStage = winningStage;
        this.indexUsed = indexUsed;
        this.totalDocsExamined = totalDocsExamined;
        this.totalKeysExamined = totalKeysExamined;
        this.nReturned = nReturned;
        this.executionTimeMillis = executionTimeMillis;
        this.indexOptimal = indexOptimal;
        this.explanation = explanation;
    }

    public String getQueryName() {
        return queryName;
    }

    public void setQueryName(String queryName) {
        this.queryName = queryName;
    }

    public String getCollection() {
        return collection;
    }

    public void setCollection(String collection) {
        this.collection = collection;
    }

    public String getFilterDescription() {
        return filterDescription;
    }

    public void setFilterDescription(String filterDescription) {
        this.filterDescription = filterDescription;
    }

    public String getWinningStage() {
        return winningStage;
    }

    public void setWinningStage(String winningStage) {
        this.winningStage = winningStage;
    }

    public String getIndexUsed() {
        return indexUsed;
    }

    public void setIndexUsed(String indexUsed) {
        this.indexUsed = indexUsed;
    }

    public long getTotalDocsExamined() {
        return totalDocsExamined;
    }

    public void setTotalDocsExamined(long totalDocsExamined) {
        this.totalDocsExamined = totalDocsExamined;
    }

    public long getTotalKeysExamined() {
        return totalKeysExamined;
    }

    public void setTotalKeysExamined(long totalKeysExamined) {
        this.totalKeysExamined = totalKeysExamined;
    }

    public long getnReturned() {
        return nReturned;
    }

    public void setnReturned(long nReturned) {
        this.nReturned = nReturned;
    }

    public double getExecutionTimeMillis() {
        return executionTimeMillis;
    }

    public void setExecutionTimeMillis(double executionTimeMillis) {
        this.executionTimeMillis = executionTimeMillis;
    }

    public boolean isIndexOptimal() {
        return indexOptimal;
    }

    public void setIndexOptimal(boolean indexOptimal) {
        this.indexOptimal = indexOptimal;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}

