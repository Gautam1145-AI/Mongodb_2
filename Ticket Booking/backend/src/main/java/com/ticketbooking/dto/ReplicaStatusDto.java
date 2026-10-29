package com.ticketbooking.dto;

import java.util.List;
import java.util.Map;

public class ReplicaStatusDto {
    private String replicaSetName;
    private String primaryNode;
    private int membersCount;
    private String readPreference;
    private String writeConcern;
    private boolean transactionSupported;
    private List<Map<String, Object>> members;
    private String statusMessage;

    public ReplicaStatusDto() {
    }

    public ReplicaStatusDto(String replicaSetName, String primaryNode, int membersCount,
                            String readPreference, String writeConcern, boolean transactionSupported,
                            List<Map<String, Object>> members, String statusMessage) {
        this.replicaSetName = replicaSetName;
        this.primaryNode = primaryNode;
        this.membersCount = membersCount;
        this.readPreference = readPreference;
        this.writeConcern = writeConcern;
        this.transactionSupported = transactionSupported;
        this.members = members;
        this.statusMessage = statusMessage;
    }

    public String getReplicaSetName() {
        return replicaSetName;
    }

    public void setReplicaSetName(String replicaSetName) {
        this.replicaSetName = replicaSetName;
    }

    public String getPrimaryNode() {
        return primaryNode;
    }

    public void setPrimaryNode(String primaryNode) {
        this.primaryNode = primaryNode;
    }

    public int getMembersCount() {
        return membersCount;
    }

    public void setMembersCount(int membersCount) {
        this.membersCount = membersCount;
    }

    public String getReadPreference() {
        return readPreference;
    }

    public void setReadPreference(String readPreference) {
        this.readPreference = readPreference;
    }

    public String getWriteConcern() {
        return writeConcern;
    }

    public void setWriteConcern(String writeConcern) {
        this.writeConcern = writeConcern;
    }

    public boolean isTransactionSupported() {
        return transactionSupported;
    }

    public void setTransactionSupported(boolean transactionSupported) {
        this.transactionSupported = transactionSupported;
    }

    public List<Map<String, Object>> getMembers() {
        return members;
    }

    public void setMembers(List<Map<String, Object>> members) {
        this.members = members;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}

