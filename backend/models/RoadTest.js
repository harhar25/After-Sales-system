const mongoose = require('mongoose');

const roadTestSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Authorization tracking
  authorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorizedByRole: { type: String, enum: ['ServiceAdvisor', 'Manager'], required: true },
  authorizationTime: { type: Date, default: Date.now },
  
  // Road test details
  testerName: { type: String, required: true },
  testerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  
  // Route compliance
  routeCompliance: {
    routeFollowed: { type: String, required: true },
    speedCompliance: { type: Boolean, default: true },
    trafficRulesCompliance: { type: Boolean, default: true },
    stopsCompliance: { type: Boolean, default: true },
    routeNotes: { type: String }
  },
  
  // Test results
  testResults: {
    overallResult: { type: String, enum: ['Pass', 'Fail', 'Needs Review'], required: true },
    mechanicalIssues: [{ type: String }],
    performanceIssues: [{ type: String }],
    safetyConcerns: [{ type: String }],
    additionalFindings: { type: String },
    recommendations: { type: String }
  },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  },
  
  // Authorization stamps
  roadTestStamp: {
    stamped: { type: Boolean, default: false },
    stampedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stampedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('RoadTest', roadTestSchema);