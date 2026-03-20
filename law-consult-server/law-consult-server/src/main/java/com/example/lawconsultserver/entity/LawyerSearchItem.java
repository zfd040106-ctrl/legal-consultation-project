package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerSearchItem {
    private Integer userId;
    private String username;
    private String avatar;
    private String firmName;
    private String specialization;
    private Integer experienceYears;
    private Integer totalConsultations;
}
