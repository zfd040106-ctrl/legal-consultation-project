package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.LawyerDocument;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface LawyerDocumentMapper {
    int insertDocument(LawyerDocument document);
    List<LawyerDocument> selectByLawyerId(@Param("lawyerId") Integer lawyerId);
    int updateStatus(@Param("id") Integer id, @Param("status") String status,
                     @Param("verifiedBy") Integer verifiedBy);
    int deleteByLawyerId(@Param("lawyerId") Integer lawyerId);
    int resetStatusByLawyerId(@Param("lawyerId") Integer lawyerId);
}
