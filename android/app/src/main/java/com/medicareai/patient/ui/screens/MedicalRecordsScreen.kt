package com.medicareai.patient.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.halilibo.richtext.markdown.Markdown
import com.halilibo.richtext.ui.material3.RichText
import com.medicareai.patient.R
import com.medicareai.patient.data.model.MedicalCase
import com.medicareai.patient.ui.theme.PrimaryBlue
import com.medicareai.patient.viewmodel.MedicalRecordsViewModel
import com.medicareai.patient.viewmodel.UiState
import java.text.SimpleDateFormat
import java.util.*
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicalRecordsScreen(
    onNavigateBack: () -> Unit,
    viewModel: MedicalRecordsViewModel = hiltViewModel()
) {
    val casesState by viewModel.casesState.collectAsState()
    
    var selectedCase by remember { mutableStateOf<MedicalCase?>(null) }
    var showDetailDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        viewModel.loadCases()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.medical_records)) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadCases() }) {
                        Icon(Icons.Default.Refresh, null)
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (casesState) {
                is UiState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is UiState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = (casesState as UiState.Error).message,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadCases() }) {
                            Text("重试")
                        }
                    }
                }
                is UiState.Success -> {
                    val cases = (casesState as UiState.Success<List<MedicalCase>>).data
                    
                    if (cases.isEmpty()) {
                        EmptyRecordsView()
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(cases) { case ->
                                MedicalCaseCard(
                                    case = case,
                                    onClick = {
                                        selectedCase = case
                                        showDetailDialog = true
                                    }
                                )
                            }
                        }
                    }
                }
                else -> {}
            }
        }
    }
    
    if (showDetailDialog && selectedCase != null) {
        CaseDetailDialog(
            case = selectedCase!!,
            onDismiss = { showDetailDialog = false }
        )
    }
}

@Composable
private fun EmptyRecordsView() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Description,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = Color.LightGray
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = stringResource(R.string.no_records),
            style = MaterialTheme.typography.titleLarge,
            color = Color.Gray
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "提交症状进行AI诊断",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray
        )
    }
}

@Composable
private fun MedicalCaseCard(
    case: MedicalCase,
    onClick: () -> Unit
) {
    val severityColor = when (case.severity) {
        "轻微", "low" -> Color(0xFF28a745)
        "轻度", "medium" -> Color(0xFFffc107)
        "中度", "high", "moderate" -> Color(0xFFfd7e14)
        "重度", "critical", "severe" -> Color(0xFFdc3545)
        else -> Color.Gray
    }
    
    val dateFormat = SimpleDateFormat("yyyy年MM月dd日 HH:mm", Locale.getDefault())
    val date = try {
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).parse(case.created_at)
    } catch (e: Exception) {
        null
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = date?.let { dateFormat.format(it) } ?: case.created_at,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
                
                case.severity?.let { severity ->
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = severityColor
                    ) {
                        Text(
                            text = severity,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = case.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "症状：${case.symptoms}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            if (!case.diagnosis.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    // 使用 RichText 渲染 Markdown 诊断摘要
                    RichText(
                        modifier = Modifier.padding(8.dp)
                    ) {
                        Markdown(
                            content = case.diagnosis.take(100) + if (case.diagnosis.length > 100) "..." else ""
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Button(
                onClick = onClick,
                modifier = Modifier.align(Alignment.End),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
            ) {
                Text(stringResource(R.string.view_details))
            }
        }
    }
}

@Composable
private fun CaseDetailDialog(
    case: MedicalCase,
    onDismiss: () -> Unit
) {
    val dateFormat = SimpleDateFormat("yyyy年MM月dd日 HH:mm", Locale.getDefault())
    val date = try {
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).parse(case.created_at)
    } catch (e: Exception) {
        null
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "🩺 诊疗详情",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
            ) {
                // Meta info
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        InfoRow("创建时间", date?.let { dateFormat.format(it) } ?: case.created_at)
                        case.severity?.let { InfoRow("严重程度", it) }
                        InfoRow("状态", when (case.status) {
                            "active" -> "进行中"
                            "completed" -> "已完成"
                            "archived" -> "已归档"
                            else -> case.status ?: "未知"
                        })
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Symptoms
                Text(
                    text = "😷 症状描述",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = case.symptoms,
                    style = MaterialTheme.typography.bodyMedium
                )
                
                // Description
                if (!case.description.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "📄 详细描述",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = case.description,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                // Diagnosis
                if (!case.diagnosis.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "🤖 AI诊断结果",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                        )
                    ) {
                        // 使用 RichText 渲染 Markdown 诊断结果
                        RichText(
                            modifier = Modifier.padding(12.dp)
                        ) {
                            Markdown(content = case.diagnosis)
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("关闭")
            }
        }
    )
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp)
    ) {
        Text(
            text = "$label：",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray,
            modifier = Modifier.width(80.dp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium
        )
    }
}